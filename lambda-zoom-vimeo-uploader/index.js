const https = require("https");
const { successResponse } = require("./utils/lambdaResponse");

class ZoomToVimeoUploader {
	account_id;
	uuid;
	id;
	host_id;
	topic;
	recording_count;
	//recording_files;
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

			console.log('GMT'+(new Date(record['recording_start']).toISOString()));

			me.records.push(record);
		});

		console.log(JSON.stringify(this.records));
	}

	async requestGetVideoFolders() { }

	async requestMoveVideosToFolders(record) { }

	async moveVideosToFolders(records) { }

	async requestSetEmbededPreset(record) { }

	async setEmbededPreset(records) { }

	async requestCheckUploadStatus(record) { }

	async checkUploadStatus(records) { }

	async requestUploadVideo(record) {
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
			body["name"] = 'GMT'+(new Date(record['recording_start']).toISOString());
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
					resolve({
						statusCode: 200,
					});
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
	}

	async uploadVideos() {
		console.log("Lets process...!");
		console.log(this.recording_files);

		//const response = await new Promise((resolve, reject) => { });

		console.log("done");
	}
}

exports.handler = async (event, ctx, cb) => {
	console.time("Zoom-Webhook");
	const payload = event["payload"];
	console.log(payload);

	const zoom2VimeoUploader = new ZoomToVimeoUploader(payload);
	await zoom2VimeoUploader.uploadVideos();

	const response = successResponse({
		message: "Success",
	});

	console.timeEnd("Zoom-Webhook");
	return response;
};
