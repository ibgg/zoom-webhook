//const Archiver = require ("archiver");
const {successResponse} = require("./utils/lambdaResponse");
//const s3Handler = require("./utils/s3Handler");
//const path = require ("path");

class ZipHandler {
	keys;
	archiveFileName;
	archiveFolderPath;
	archiveFormat
	constructor(keys, archiveFileName, archiveFolderPath, archiveFormat) {
		/*this.keys = keys;
		this.archiveFileName = archiveFileName;
		this.archiveFolderPath = archiveFolderPath;
		this.archiveFormat = archiveFormat;
		this.s3Handler = new s3Handler();
		*/
	}

	s3DownloadStreams(){
		/*
		return this.keys.map((key) => {
			return {
				stream: this.s3Handler.readStream(process.env.BUCKET, key),
				filename: `${path.basename(key)}`,
			};
		});
		*/
	}

	async process() {
		/*
		// _fname is the filezip full name
		let _fname = `${this.archiveFolderPath}/${this.archiveFileName}`;

		// Defining the stream to upload the file.
		// s3StreamUpload: streamPassThrough,
		// uploaded: S3 function to upload the zip file
		const { s3StreamUpload, uploaded } = this.s3Handler.writeStream(process.env.BUCKET, process.env.REGION, _fname);

		// Defining the download streams (these are the separated files)
		const s3DownloadStreams = this.s3DownloadStreams();

		await new Promise((resolve, reject) => {
			const archive = Archiver(this.archiveFormat);

			archive.on('error', (error) => { throw new Error(`${error.name} ${error.code} ${error.message} ${error.path} ${error.stack}`); });

			s3StreamUpload.on('close',  resolve);
			s3StreamUpload.on('end',  resolve);
			s3StreamUpload.on('error', reject);
			archive.pipe(s3StreamUpload);

			// Appending files to archived zip file
			s3DownloadStreams.forEach((streamDetails) => { archive.append(streamDetails.stream, { name: streamDetails.filename })});
			archive.finalize();
		}).catch((error) => {
			throw new Error(`${error.code} ${error.message} ${error.data}`);
		});

		// Starting the upload
		await uploaded.promise();
		*/
		console.log('done');
	}
}

exports.handler= async (event, ctx, cb) => {
  console.time('Zoom-Webhook');
  console.log(event);

  //const { keys, archiveFileName, archiveFolderPath, archiveFormat } = event;

  //const zipHandler = new ZipHandler(keys, archiveFileName, archiveFolderPath, archiveFormat);
  //await zipHandler.process();

  const response = successResponse({
    message: 'Success'
  });

  console.timeEnd('Zoom-Webhook');
  return response;
}
