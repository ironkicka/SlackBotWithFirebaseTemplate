'use strict'
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const config = functions.config();
let db = admin.firestore();


const { App, ExpressReceiver} = require('@slack/bolt');
const expressReceiver = new ExpressReceiver({
    signingSecret: config.slack.signing_secret,
    endpoints: '/events',
    processBeforeResponse: true
});
const app = new App({
    receiver: expressReceiver,
    token: config.slack.bot_token,
    processBeforeResponse: true
});

app.error(console.log);


const titleInput =
    {
        type: 'input',
        block_id: 'block_id',
        label: {
            type: 'plain_text',
            text: 'hogehoge'
        },
        element: {
            type: 'plain_text_input',
            action_id: 'action_id',
            multiline: false
        }
    }

const defaultBlocks = [
    titleInput
]

app.command('/コマンドの名前', async ({ ack, body, client })=>{
    await ack();
    console.log("リクエストきたよ！")
    let VIEW_ID = "modal_1";
    try {
        const result = await client.views.open({
            // 適切な trigger_id を受け取ってから 3 秒以内に渡す
            trigger_id: body.trigger_id,
            // view の値をペイロードに含む
            view: {
                type: 'modal',
                // callback_id が view を特定するための識別子
                callback_id:VIEW_ID,
                title: {
                    type: 'plain_text',
                    text: 'モーダルタイトル'
                },
                blocks:defaultBlocks,
                submit: {
                    type: 'plain_text',
                    text: 'Submit'
                }
            }
        });
        console.log("モーダル開くよ",result);
    }
    catch (error) {
        console.error(error);
    }

    // モーダルでのデータ送信イベントを処理します
    app.view(VIEW_ID,async ({ ack, body, view, client }) => {
        console.log("モーダルのデータを受信")
        // モーダルでのデータ送信イベントを確認
        await ack();

        // 入力値を使ってやりたいことをここで実装 - ここでは DB に保存して送信内容の確認を送っている
        const val = view['state']['values']['block_id']['action_id'].value;
        const msg = `hello,world with ${val}`
        const userId = body['user']['id'];
        // ユーザーにメッセージを送信
        try {
            await client.chat.postMessage({
                channel: userId,
                text: msg
            });
        }
        catch (error) {
            console.error(error);
        }

    });
});

exports.slack = functions
    .region('asia-northeast1')
    .https.onRequest(expressReceiver.app);

