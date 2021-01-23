const { Console } = require("console");
const https = require("https");
const { successResponse } = require("./utils/lambdaResponse");

class ZoomToVimeoUploader {
	account_id;
	uuid;
	id;
	host_id;
	topic;
	recording_count;
	vimeo_headers;
	records;
	VIDEO_DESCRIPTION;

	constructor(payload) {
		this.VIDEO_DESCRIPTION = "Video de sesión de: {topic}, al {start_date}";
		this.account_id = payload.account_id;
		this.uuid = payload.object.uuid;
		this.id = payload.object.id;
		this.host_id = payload.object.host_id;
		this.topic = payload.object.topic;
		this.recording_count = payload.object.topic;
		//this.recording_files = payload.object.recording_files;
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
			record["file_name"] = 'GMT'+ dt.getFullYear()+dt.getMonth().toString().padStart(2,'0')+dt.getDay().toString().padStart(2,'0')+'-'+dt.getHours().toString().padStart(2,'0')+dt.getMinutes().toString().padStart(2,'0')+dt.getSeconds().toString().padStart(2,'0');;

			me.records.push(record);
		});

		this.vimeo_headers = {
			"content-type": "application/json",
			authorization: "Bearer " + process.env.VIMEO_TOKEN,
		};

		console.log(JSON.stringify(this.records));
	}

	async httpRequest(method, hostname, path, headers, body){
		let me = this;
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
					console.log('ERROR STATUS CODE '+ es.statusCode);
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

	async requestGetVideoFolders() {
		const response = await new Promise((resolve, reject) => {

		});
		return response;
	}

	async requestMoveVideosToFolders(record) {
		const response = await new Promise((resolve, reject) => {

		});
		return response;
	}

	async moveVideosToFolders(records) {

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
						record['vimeo_embedded'] = true
					}
				}

				if (record['vimeo_status'] == 'available')
					console.log (`Available ${record['file_name']} video!`);
				else
					console.log (`Transcoding video ${record['file_name']} almost ready`);

			}else if (record['vimeo_status'] != 'error'){
				if (!record['vimeo_embedded']){
					let path = `/videos/${record['vimeo_id']}/presets/${process.env.VIMEO_PRESET_ID}`
					let presetStatus = await me.httpRequest("PUT", "api.vimeo.com", path, me.vimeo_headers);
					console.log(presetStatus);
					if (presetStatus.statusCode == undefined || presetStatus.statusCode == null){
						record['vimeo_embedded'] = true
					}
				}
				console.log('Not yet available video ' + record['file_name']+' lets try in ' +13+' seconds')
				unavailablecount += 1;
			}else{
				console.log('Error status for video '+record['file_name']);
			}
		}
		if (unavailablecount>0){
			await me.sleep(7000);
			await me.checkUploadStatus();
		}
	}

	async requestUploadVideo(record) {
		console.log('::::::::::::::::::::::::::::::Backup video files from zoom::::::::::::::::::::::::::::::');
		const response = await new Promise((resolve, reject) => {
			var options = {
				method: "POST",
				hostname: "api.vimeo.com",
				port: null,
				path: "/me/videos",
				headers: {
					"content-type": "application/json",
					authorization: "Bearer " + process.env.VIMEO_TOKEN,
				},
			};
			console.log(options);

			var body = {};
			let dt = new Date(record['recording_start']);

			body["name"] = 'GMT'+ dt.getFullYear()+dt.getMonth().toString().padStart(2,'0')+dt.getDay().toString().padStart(2,'0')+'-'+dt.getHours().toString().padStart(2,'0')+dt.getMinutes().toString().padStart(2,'0')+dt.getSeconds().toString().padStart(2,'0');;
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

			console.log(JSON.stringify(body));

			var req = https.request(options, function (res) {
				var chunks = [];
				res.on("data", function (chunk) {
					console.log(chunk);
					chunks.push(chunk);
				});

				res.on("end", function () {
					var body = Buffer.concat(chunks);
					console.log(body.toString());
					resolve(JSON.parse(body.toString()));
				});

				req.on("error", (e) => {
					console.log(e);
					reject({
						statusCode: 500,
						body: "Something went wrong!",
					});
				});
			});

			req.write(JSON.stringify(body));
			req.end();
		});
		return response;
	}

	async uploadVideos() {
		let me = this;
		for (const record of me.records){
			const response = await me.requestUploadVideo(record);
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

	const response = successResponse({
		message: "Success",
	});

	console.timeEnd("Zoom-Webhook");
	return response;
};
