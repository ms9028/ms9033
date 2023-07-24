const AWS = require('aws-sdk');
AWS.config.update({
    region: "ap-northeast-2"
});
const {
    RawAesKeyringNode,
    RawAesWrappingSuiteIdentifier,
    buildClient,
    KmsKeyringNode,
    KmsKeyringBrowser,
    encryptionSdk,
    CommitmentPolicy
} = require('@aws-crypto/client-node')
const zlib = require("zlib");
const { handleHttpRequest } = require('slsberry');
const apiSpec = {
    category: 'http',
    event: [
        {
            type: 'PURE',
        },
    ],
    desc: 'Handle Kinesis Stream',
    memorySize: 300,
    parameters: {

    },
    errors: {
        unexpected_error: { status_code: 500, reason: '알 수 없는 에러' },
    },
    responses: {
        description: '',
        content: 'application/json',
        schema: {

        },
    },
};
exports.apiSpec = apiSpec;
async function handler(inputObject, event) {
    //자세한 형식은 https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/DBActivityStreams.Monitoring.html#DBActivityStreams.KinesisAccess 참조
    //console.log(event);
    // const event = {
    //     "Records": [
    //         {
    //             "kinesis": {
    //                 "kinesisSchemaVersion": "1.0",
    //                 "partitionKey": "180391c7-e253-4d4f-a21d-06f44ef61be2",
    //                 "sequenceNumber": "49642881480676763694242309434545606762700577414896943122",
    //                 "data": "eyJ0eXBlIjogIkRhdGFiYXNlQWN0aXZpdHlNb25pdG9yaW5nUmVjb3JkcyIsInZlcnNpb24iOiAiMS4yIiwiZGF0YWJhc2VBY3Rpdml0eUV2ZW50cyI6ICJBWUFEZU5NN1JlQmMrYlZBMkNKaEF2dCtDUzRBWHdBQkFCVmhkM010WTNKNWNIUnZMWEIxWW14cFl5MXJaWGtBUkVGc1NIZzVaemRwWjBWVGVXaEhWVVo0Y0VnemJuZzVhMWw2Ym1sRVJUTm5lVXBzZDNVeGJrZEdOVWszUTFwM2JrWjRVekZwYzB0amJtZHJkVmszTlhSdFp6MDlBQUVBQWtKREFCdEVZWFJoUzJWNUFBQUFnQUFBQUF6c1dQaGY2SHl4bGhYNXphY0FNRVpyaXFuUXpxVnBiT1hKYjczL29LK2FGbU9RcW5PbUlVcU90bHRDUXcvU2c1d2owSi96Njlubk5tOWFUK1BYcHdJQUFBQUFEQUFFQUFBQUFBQUFBQUFBQUFBQUFBQnkzU1pkYlZlSHprTjRYL3d1TG1pYi8vLy8vd0FBQUFFQUFBQUFBQUFBQUFBQUFBRUFBQUlTZjZmazFXV0pTWWttU0gzTWFOVk1UdCsrS1M0UktJVVdmZ200WnNTOFBIV29iSEYwcko4VmZEZzdaUW1aRis1aHBDQWZBTHVQc2gzaXR3WWdhc3ZqNU14TWZwUk4yMkVWdlRjdkc2eHFDOVQ2YVJ1M0I1bFJmRXNVQkZqRzFKV0dRWnM3V21Jbk9kdHB2Z2gxNmR2aHd5THBYZm5CNTBFbGFESlhzaVJUdjBTOEI0VS9ueGI4cWFCR3pwcUtwM3dvSFp5WmMrZGUzOS90OWdoOTc0UDBXUzRNTEhERFUrTVRabU0yQzdoUGIwWjRGK3hVS29EMnVBaWVqeThRRDVnVVZRbkZzZEJHV3BHQ1ZOZm82cmNiWEVzQzdNZWE5SkVndzh3RkhsbkNyTElLS09lSVpobml5eUdheEZaRHBoTW5HYnhMSFBSUU1VMjF6c1RCQndvUjJSZzRTNXROdkFGenUvbU5RYldmOG1ReW1ONUxka0VkQ3RVT0F2cDFMeisrOGl1a3lKM296czN0Vmc3OEVRMS9tY0hydjRGUitIbHBNcW9CMVdwck82ZGpndTk5MlFLT0tzaEhtWGRndTFmek5XQWdtaHZwTU0waXRmRE1taTM5UkdkaXdYd1JzcFlHd0NBRjBTaUROTEFEdGJqT1ZBcFVtaXEzS3l6RTRGQllSQ3U1anNhODYvOEJkYUd0bU9wcFNDeUZsck5CbFlmYm1jK0RIbEdrMjBGUkJvcEtqQTZDQlo4cWw1UEF5MXRLRmZKQnNnNWNDSTM3ZDBrK2tNbUZuWHNJMDlqV1VzKzdib2pId3R3M0NoWDAwT0JzR3lwUlVsRnFxbzBZY3RRNDlTU1l4S3IrajR2dGFsamxhOVZiZ3ZZTzUveURsUUI0bEpPMDJUZjV2a01UM294MUpCaGl5T2VwUXlkUFFweG02clpPc3pnUSttRytqSVBtaFAxLy9CUjBBR2N3WlFJeEFLeHorUVdtWnJkYzVHYmJNS0JwQzVVMGtueElaZVNaTktEV3NBZTd0WjVMTGdIZDJpODlmcTgyQXU5Y0JGaUU5d0l3RUQ1ZGp6MWg1am9XV2JtRzcxL3VhdElvYmNrNGxQVWsyOURBUG9CL3EvVzAyUmJIdXB6VWpTUVVHNitFdThLUSIsImtleSIgOiAiQVFJREFIaWdTTXJBSThUenZNMG93SGcwUnNFWXgrbmtpc3lYdkM1NGE5SXpHb1dOa0FGQVZYM0VsZ2EzM0M5NndYVFdrV0swQUFBQWZqQjhCZ2txaGtpRzl3MEJCd2FnYnpCdEFnRUFNR2dHQ1NxR1NJYjNEUUVIQVRBZUJnbGdoa2dCWlFNRUFTNHdFUVFNQ3JYamNrdnd2K0tzbDFBbUFnRVFnRHV2ZDhHRFpGb2tqLzI3a3Z5Q3NsUHhQa2RRL040djJsOEpTMTFuSmhmVlVUWWprT3FLSm50WUdhTFl0aFFCTzFvaWFnSk9aSU5uQzdPZHR3PT0ifQ==",
    //                 "approximateArrivalTimestamp": 1690034653.976
    //             },
    //             "eventSource": "aws:kinesis",
    //             "eventVersion": "1.0",
    //             "eventID": "shardId-000000000001:49642881480676763694242309434545606762700577414896943122",
    //             "eventName": "aws:kinesis:record",
    //             "invokeIdentityArn": "arn:aws:iam::000000000000:role/Demo-My-Lambda-Role",
    //             "awsRegion": "ap-northeast-2",
    //             "eventSourceARN": "arn:aws:kinesis:ap-northeast-2:000000000000:stream/aws-rds-das-cluster-B6K6E4422P5KM33ZF7GCJOA44A"
    //         },
    //         {
    //             "kinesis": {
    //                 "kinesisSchemaVersion": "1.0",
    //                 "partitionKey": "a28f4952-a666-4b24-978d-93d6a595b9f8",
    //                 "sequenceNumber": "49642881480676763694242309434548024614339806673246355474",
    //                 "data": "eyJ0eXBlIjogIkRhdGFiYXNlQWN0aXZpdHlNb25pdG9yaW5nUmVjb3JkcyIsInZlcnNpb24iOiAiMS4yIiwiZGF0YWJhc2VBY3Rpdml0eUV2ZW50cyI6ICJBWUFEZUdMS2ora1ptR04vUUY5SlhzOFlySHdBWHdBQkFCVmhkM010WTNKNWNIUnZMWEIxWW14cFl5MXJaWGtBUkVGcU1XUXdSak13Y0V0UmIzUm9hbFJhVW14eFpUUk9iVElyVVM5REx5c3JNa3h6VFV0NUwxazVTRWh4VURFck1qZHVMMWQ0ZUhwd2FrUlpkbVJRVGt0SVp6MDlBQUVBQWtKREFCdEVZWFJoUzJWNUFBQUFnQUFBQUF4bzFGVnBabVhjZjBlYW4wY0FNT1JMM0ZvMGw0SE01c3haNDZDQ2xBSjdHYUliVFNwR0RqNkQ4dzNMa2tXNThMNDJybG81NHU3eXZRMSs4RFpDSGdJQUFBQUFEQUFFQUFBQUFBQUFBQUFBQUFBQUFBQSt5ZGZvdk1ualpicVUrYmRDTk1qTy8vLy8vd0FBQUFFQUFBQUFBQUFBQUFBQUFBRUFBQUtEcjZXQTFmN0tDcTRLZnN3aEpjMmFJK0VWdHhLTTVnbDh3YlEwTzJoNlZBdmFpZXo3eUlYMXNMbVhzSFZPdWZ0VGpUZDczV3FOL3poV0ZDNlYxUEF5MTZOaGZjWFlVOVFHbmtQZU84VkxWU1VRb2dUakxrR2trejE0ZXA4NHFEMmJyNnJOZ0lYbzYzOEsvMGorQm9GSWVmTjNHN0NVbG5SeHArQitENy82d3V4U0hQUmNvbFhhQ3c1alRHbWNLWklkS1dIRmN5aGtuclRncGFCQkUyR2xxYk5sMWd4Znd5ZDFuUUxkMlZicU5RdjFXbGM4blFCcjMxU0NRYXJrUndoNElqa0R4ZGg4SVltbm94SFMvUEZPWDM0bCtJK21QbStieW9HQlEzd09xRHU1UXNRLzc5bnV0Z3Zqd3BMUnZwOHp6eWhFcWI3ZmVGa3pvL2N2WXdnYVd3eXdwbUZ1dlo1Tnk4ajRyS252WktxZ2wwMVRVMis2R1lUbGRqRWZxQ2lkaEtKWnFjRXVpUGd3VXFOU0hlQ3h1Yzd4OUNIcGJnbFpJYytRdEoweVNITGZoV2lLMWQxT1F5eUZ1U2V2K1hvQU1JSTlVeTZwQkxrR0VQZlhtaFpIWG5rSHg3THd0NzhvbTNBNjJXdFdrRklVZzNxRDE4RE8xb0pITWwzdGxPNmNENllXNm83cVNpYUViaElzTzlHQ3krcjRTUzVSdTJ2MjFrL2d1VXUzdEF0UjZqVFZpNDZNZG5NaHZ2Ykp3QUJxd3dtL3dpcmVvUGZpb0NRSUNVY21uOHZrbksxbWNOM1ZaL3Z2WUd5NWpNMlFybFhGakFNQ1hRYkh1SmI0bmt6Q3dLZUJ1Qm1IcFVaRDdpaEowTXhvVFJzY2FnTGoyVkVNdEFiakRsZ3BlSE5CdEZ5NGREdlNUMGsxSmpwT0dncjFpYzNpdkdQdGVYekJxUnFsTXJYOHRPb3RqN2w3Zzk0NmE2Sm1FbUVGS2hjWktpUXRlRjRBYXlBSk11REtWcTI3eno3RG5XS0FMUjNtNUlidGJmWmNOU1Eybnk5WEVNRXB4RTUxNWRmaytISzdiQm90NDVvYVUwOHYyd1JGallkSmkxQ2x5WVZhekxxcmFjNldqdHV5VjNXb1p4cmZ5T1I4WlovWndnV25vNFhCRE4wQVp6QmxBakVBckxhV05JTEVWaEJaS3M2MHNXeFU3dlRpK3B0NXExejVCaWpmVDNYazNVMlY0czhLdXEwdjBrTnozdG9SelVSUUFqQmxKbXpaSEpnMGMyclNBbHd4QnNsTmlhVWdadkZkM0w2V3U3S3hoNHI1SExoRkQ4dVg0cnAyVXVNdGdCVGdmTms9Iiwia2V5IiA6ICJBUUlEQUhpZ1NNckFJOFR6dk0wb3dIZzBSc0VZeCtua2lzeVh2QzU0YTlJekdvV05rQUZBVlgzRWxnYTMzQzk2d1hUV2tXSzBBQUFBZmpCOEJna3Foa2lHOXcwQkJ3YWdiekJ0QWdFQU1HZ0dDU3FHU0liM0RRRUhBVEFlQmdsZ2hrZ0JaUU1FQVM0d0VRUU1DclhqY2t2d3YrS3NsMUFtQWdFUWdEdXZkOEdEWkZva2ovMjdrdnlDc2xQeFBrZFEvTjR2Mmw4SlMxMW5KaGZWVVRZamtPcUtKbnRZR2FMWXRoUUJPMW9pYWdKT1pJTm5DN09kdHc9PSJ9",
    //                 "approximateArrivalTimestamp": 1690034653.981
    //             },
    //             "eventSource": "aws:kinesis",
    //             "eventVersion": "1.0",
    //             "eventID": "shardId-000000000001:49642881480676763694242309434548024614339806673246355474",
    //             "eventName": "aws:kinesis:record",
    //             "invokeIdentityArn": "arn:aws:iam::000000000000:role/Demo-My-Lambda-Role",
    //             "awsRegion": "ap-northeast-2",
    //             "eventSourceARN": "arn:aws:kinesis:ap-northeast-2:000000000000:stream/aws-rds-das-cluster-B6K6E4422P5KM33ZF7GCJOA44A"
    //         }
    //     ]
    // }
    const kms = new AWS.KMS();
    for (const record of event.Records) {
        try {
            //일단 데이터를 base64 decode
            const data = JSON.parse(Buffer.from(record.kinesis.data, 'base64').toString('utf-8'));
            const payloadDecoded = Buffer.from(data.databaseActivityEvents, 'base64');
            //각 데이터별로 인크립트 된 키를 KMS에게 요청해서 복호화
            const keydata = await kms.decrypt({
                CiphertextBlob: Buffer.from(data.key, 'base64'),
                EncryptionContext: {
                    "aws:rds:dbc-id": process.env.clusterId,
                }
            }).promise();
            //다음이 복호화된 마스터 키
            const unencryptedMasterKey = new Uint8Array(keydata.Plaintext);
            const { encrypt, decrypt } = buildClient(
                CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT
            );
            //decrypted key를 만들어서
            const decryptKey = new RawAesKeyringNode({
                keyName: "DataKey",
                keyNamespace: "BC",
                wrappingSuite: RawAesWrappingSuiteIdentifier.AES256_GCM_IV12_TAG16_NO_PADDING,
                unencryptedMasterKey: unencryptedMasterKey,
            });
            //복호화
            const { plaintext, messageHeader } = await decrypt(decryptKey, payloadDecoded, { encoding: 'base64' });
            //압축 해제
            const decompressed = await unzipData(plaintext);
            //databaseActivityEventList를 돌면서 내용 확인
            //자세한 형식은 https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/DBActivityStreams.Monitoring.html#DBActivityStreams.KinesisAccess 참조
            for (const activity of decompressed.databaseActivityEventList) {
                // {
                //     logTime: '2023-07-23 08:14:58.089874+00',
                //     type: 'record',
                //     clientApplication: null,
                //     pid: 257,
                //     dbUserName: 'admin',
                //     databaseName: 'tb_my_database',
                //     remoteHost: '116.127.85.242',
                //     remotePort: '5257',
                //     command: 'QUERY',
                //     commandText: "UPDATE `tb_my_database`.`my_table` SET `contents` = '666' WHERE (`idx` = '2')",
                //     paramList: null,
                //     objectType: 'TABLE',
                //     objectName: 'my_table',
                //     statementId: 17903,
                //     substatementId: 1,
                //     exitCode: '0',
                //     sessionId: '1003',
                //     rowCount: 0,
                //     serverHost: 'my-db-instance-1',
                //     serverType: 'MySQL',
                //     serviceName: 'Amazon Aurora MySQL',
                //     serverVersion: '5.7.mysql_aurora.2.11.2',
                //     startTime: '2023-07-23 08:14:58.089635+00',
                //     endTime: '2023-07-23 08:14:58.089875+00',
                //     transactionId: '1640266',
                //     dbProtocol: 'MySQL',
                //     netProtocol: 'TCP',
                //     errorMessage: '',
                //     class: 'MAIN'
                //   }
                if (activity.type == "heartbeat") {
                    continue;
                }
                //console.log(`[${activity.class}]${activity.logTime}: ${activity.commandText}`);
                //내가 주목하는 데이터베이스이고,
                if (activity.databaseName == process.env.databaseName) {
                    const commandText = activity.commandText.toLowerCase();
                    //내가 주목하는 테이블이며,
                    if (commandText.includes(process.env.tableName)) {
                        //insert, update, delete가 commandText에 있다면,
                        if (commandText.includes("insert") || commandText.includes("update") || commandText.includes("delete")) {
                            //sns보내기
                            console.log(activity);
                            var params = {
                                Message: `[rds-activity]
commandText: ${activity.commandText}
logTime: ${activity.logTime}
raw: ${JSON.stringify(activity)}
`,
                                TopicArn: process.env.alarm_topic,
                            };
                            await new AWS.SNS({ apiVersion: '2010-03-31', region: 'ap-northeast-2' }).publish(params).promise();
                        }
                    }
                }
            }
        } catch (e) {
            console.log(e);
        }
    }
    return {
        status: 200,
        response: {
        }
    };
}
async function unzipData(plaintext) {
    return new Promise((resolve, reject) => {
        zlib.unzip(plaintext, (err, buffer) => {
            if (err) {
                reject(err);
            } else {
                try {
                    const events = JSON.parse(buffer);
                    resolve(events);
                } catch (jsonErr) {
                    reject(jsonErr);
                }
            }
        });
    });
}
exports.handler = async (event, context) => {
    return await handleHttpRequest(event, context, apiSpec, handler);
};