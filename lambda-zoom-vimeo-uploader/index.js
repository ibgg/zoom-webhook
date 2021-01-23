const { Console, timeStamp } = require("console");
const https = require("https");
const { successResponse } = require("./utils/lambdaResponse");

class ZoomToVimeoUploader {
	vimeo_headers;
	records;

	constructor(payload) {
		this.records = [];
		let me = this;

		payload.object.recording_files.forEach((item, i) => {
			let record = {};
			//record['email'] = item['host_email'];
			record['recording_start'] = item['recording_start'];
			record['recording_end'] = item['recording_end'];
			record['download_url'] = item['download_url'];
			record['play_url'] = item['play_url'];
			record['topic'] = payload.object.topic;
			record['record_id'] = item['id'];
			record['meeting_id'] = item['meeting_id'];
			record['meeting_uuid'] = payload.object.uuid;
			record['status'] = 'listed';
			record['file_size'] = item['file_size'];
			record['file_extension'] = item['file_extension'];
			record['vimeo_id']='';
			record['vimeo_uri']='';
			record['vimeo_status']='pending';
			record['vimeo_transcode_status']='pending';
			record['vimeo_embedded'] = false;
			record['vimeo_folder']=payload.object.topic.substring(0,31);

			let dt = new Date(record['recording_start']);
			record["file_name"] = 'GMT'+ dt.getFullYear()+dt.getMonth().toString().padStart(2,'0')+dt.getDay().toString().padStart(2,'0')+'-'+dt.getHours().toString().padStart(2,'0')+dt.getMinutes().toString().padStart(2,'0')+dt.getSeconds().toString().padStart(2,'0');

			me.records.push(record);
		});

		this.vimeo_headers = {
			"content-type": "application/json",
			authorization: "Bearer " + process.env.VIMEO_TOKEN,
		};

		console.log(JSON.stringify(this.records));
	}

	async httpRequest(method, hostname, path, headers, body){
		const response = await new Promise((resolve, reject) => {
			var options = {
				method: method,
				hostname: hostname,
				port: null,
				path: path,
				headers: headers,
			};

			var req = https.request(options, function (res) {
				var chunks = [];

				if (res.statusCode < 200 || res.statusCode > 299){
					console.log('ERROR STATUS CODE '+ res.statusCode);
					resolve({
						statusCode: 500,
						body: "Something went wrong!",
					});
				}

				res.on("data", function (chunk) {
					chunks.push(chunk);
				});

				res.on("end", function () {
					var body = Buffer.concat(chunks);
					console.log("BODY");
					console.log(body.toString());
					if (body !== undefined && body !== null && body.toString() !== null && body.toString() !== undefined && body.toString() !== '' && body.toString() !== ""){
						resolve(JSON.parse(body.toString()));
					}else{
						resolve({});
					}
				});
			});

			req.on("error", (e) => {
				console.log(e);
				reject({
					statusCode: 500,
					body: "Something went wrong!",
				});
			});


			if (body!=null && body!=undefined){
				console.log('NOT UNDEFINED BODY');
				req.write(JSON.stringify(body));
			}

			req.end();
		});
		return response;
	}

	async sleep(ms) {
		return new Promise((resolve) => {
		  setTimeout(resolve, ms);
		});
	}

	async moveVideosToFolders() {
		console.log('::::::::::::::::::::::::::::::moving videos to folder::::::::::::::::::::::::::::::');
		let me = this;
		let response = await me.httpRequest("GET", "api.vimeo.com", `/users/${process.env.VIMEO_USER_ID}/projects`, me.vimeo_headers);
		let folders = [];
		if (response['total'] > 0){
			console.log('requested folders');
			console.log(JSON.stringify(response['data']));
			response['data'].forEach((record) => {
				folders[record['name']] = record['uri'].substring(record['uri'].lastIndexOf('/')+1,record['uri'].length);
			});
			console.log(folders);
		}

		let videos_list = [];
		me.records.forEach((record)=>{
			if (Object.keys(videos_list).indexOf(record['vimeo_folder']) < 0){
				videos_list[record['vimeo_folder'].trim()] = [];
			}
			videos_list[record['vimeo_folder'].trim()].push(record['vimeo_uri']);
		});
		console.log('videos list');
		console.log(videos_list);


		for (const record of Object.entries(videos_list)){
			if (Object.keys(folders).indexOf(record[0]) < 0){
				let body = {};
				body["name"]=record[0];
				// Lets create folder
				const resp1 = await me.httpRequest("POST","api.vimeo.com", `/users/${process.env.VIMEO_USER_ID}/projects`, me.vimeo_headers, body);
				console.log('resp1');
				console.log(JSON.stringify(resp1));
				if (resp1.statusCode == undefined || resp1.statusCode == null){
					folders[record[0]] = resp1['uri'].substring(resp1['uri'].lastIndexOf('/')+1,resp1['uri'].length);
					let videos_str = videos_list[record[0]].join(',');
					let query = {'uris':videos_str};
					let resp2 = await me.httpRequest("PUT", "api.vimeo.com", `https://api.vimeo.com/users/${process.env.VIMEO_USER_ID}/projects/${folders[record[0]]}/videos?uris=${videos_str}`, me.vimeo_headers, null);
				}
			} else {
				let videos_str = videos_list[record[0]].join(',');
				let query = {'uris':videos_str};
				let resp2 = await me.httpRequest("PUT", "api.vimeo.com", `https://api.vimeo.com/users/${process.env.VIMEO_USER_ID}/projects/${folders[record[0]]}/videos?uris=${videos_str}`, me.vimeo_headers);
			}
			return 'timeStamp';
		}
	}

	async checkUploadStatus() {
		console.log('::::::::::::::::::::::::::::::Checking video status from Vimeo::::::::::::::::::::::::::::::');
		let me = this;
		let unavailablecount = 0;
		for (const record of me.records){
			let response = await me.httpRequest("GET", "api.vimeo.com", "/me/"+record['vimeo_uri'], me.vimeo_headers); //me.requestCheckUploadStatus(record);
			record['vimeo_status']=response['status'];
			if (record['vimeo_status'] == 'available' || record['vimeo_status'] == 'transcoding'){
				if (!record['vimeo_embedded']){
					let path = `/videos/${record['vimeo_id']}/presets/${process.env.VIMEO_PRESET_ID}`;
					let presetStatus = await me.httpRequest("PUT", "api.vimeo.com", path, me.vimeo_headers);
					console.log(presetStatus);
					if (presetStatus.statusCode == undefined || presetStatus.statusCode == null){
						record['vimeo_embedded'] = true;
					}
				}

				if (record['vimeo_status'] == 'available')
					console.log (`Available ${record['file_name']} video!`);
				else
					console.log (`Transcoding video ${record['file_name']} almost ready`);

			}else if (record['vimeo_status'] != 'error'){
				if (!record['vimeo_embedded']){
					let path = `/videos/${record['vimeo_id']}/presets/${process.env.VIMEO_PRESET_ID}`;
					let presetStatus = await me.httpRequest("PUT", "api.vimeo.com", path, me.vimeo_headers);
					console.log(presetStatus);
					if (presetStatus.statusCode == undefined || presetStatus.statusCode == null){
						record['vimeo_embedded'] = true;
					}
				}
				console.log('Not yet available video ' + record['file_name']+' lets try in ' +13+' seconds');
				unavailablecount += 1;
			}else{
				console.log('Error status for video '+record['file_name']);
			}
		}
		if (unavailablecount>0){
			await me.sleep(10000);
			await me.checkUploadStatus();
		}
	}

	async uploadVideos() {
		let me = this;
		for (const record of me.records){
			var body = {};
			let dt = new Date(record['recording_start']);

			body["name"] = 'GMT'+ dt.getFullYear()+dt.getMonth().toString().padStart(2,'0')+dt.getDay().toString().padStart(2,'0')+'-'+dt.getHours().toString().padStart(2,'0')+dt.getMinutes().toString().padStart(2,'0')+dt.getSeconds().toString().padStart(2,'0');
			body["description"] = `Video de sesión de: ${record['topic']}, al ${record['recording_start'] }`;

			var privacy = {};
			privacy["view"] = "unlisted";
			privacy["embed"] = "public";
			privacy["comments"] = "nobody";
			privacy["download"] = "false";

			var upload = {};
			upload["approach"] = "pull";
			upload["size"] = record.file_size;
			upload["link"] = record.download_url;

			body["upload"] = upload;
			body["privacy"] = privacy;

			const response = await me.httpRequest("POST", "api.vimeo.com", "/me/videos", me.vimeo_headers, body); //await me.requestUploadVideo(record);
			console.log(JSON.stringify(response));
			record['vimeo_uri'] = response['uri'];
			record['vimeo_status'] = response['upload']['status'];
			record['vimeo_transcode_status'] = response['transcode']['status'];
			record['vimeo_id']= record['vimeo_uri'].substring(8,record['vimeo_uri'].length);	
		}
		console.log(JSON.stringify(me.records));
	}
}

exports.handler = async (event, ctx, cb) => {
	console.time("Zoom-Webhook");
	const payload = event["payload"];
	console.log(payload);

	const zoom2VimeoUploader = new ZoomToVimeoUploader(payload);
	await zoom2VimeoUploader.uploadVideos();
	await zoom2VimeoUploader.checkUploadStatus();
	await zoom2VimeoUploader.moveVideosToFolders();

	const response = successResponse({
		message: "Success",
	});

	console.timeEnd("Zoom-Webhook");
	return response;
};
