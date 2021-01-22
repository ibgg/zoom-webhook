const aws = require ("aws-sdk");
const Lambda = new aws.Lambda();
/**
 * Note: Step Functions, which are called out in many answers online, do NOT actually work in this case.  The reason
 * being that if you use Sequential or even Parallel steps they both require everything to complete before a response
 * is sent.  That means that this one will execute quickly but Step Functions will still wait on the other one to
 * complete, thus defeating the purpose.
 *
 * @param {Object} event The Event from Lambda
 */
exports.handler= async (event, ctx, cb) => {
	console.log(JSON.stringify( event ));

    let params = {
      FunctionName: "zoom-vimeo-uploader",
      InvocationType: "Event",  // <--- This is KEY as it tells Lambda to start execution but immediately return / not wait.
      Payload: JSON.stringify( event )
    };

    // we have to wait for it to at least be submitted. Otherwise Lambda runs too fast and will return before
    // the Lambda can be submitted to the backend queue for execution
    await new Promise((resolve, reject) => {
        Lambda.invoke(params, function(err, data) {
            if (err) {
                reject(err, err.stack);
            }
            else {
                resolve('Lambda invoked: '+data) ;
            }
        });
    });

    // Always return 200 not matter what
    return {
        statusCode : 200,
        //keyResponse: `${archiveFolderPath}/${archiveFileName}`
    };
};
