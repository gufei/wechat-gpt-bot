import fs from "fs";
import type {Message} from "wechaty";

const filepath = './config.json'
let ListData = fs.readFileSync(filepath, 'utf8');
export let ListConfig = JSON.parse(ListData);

console.log(ListConfig)

fs.watchFile(filepath, (curr, prev) => {
        if (curr.mtime > prev.mtime) {
            ListData = fs.readFileSync(filepath, 'utf8');

            // parse JSON string to JSON object
            ListConfig = JSON.parse(ListData);
        }

        console.log('Config File Loading');
    }
);


export async function auth(msg:Message){
    const nowDate = new Date()
    const fromContact = msg.talker()
    const room = msg.room()

    if (room) {
        if (ListConfig.room.hasOwnProperty(await room.topic()) && ListConfig.room[await room.topic()]) {
            let fromDate = new Date(ListConfig.room[await room.topic()])
            if (fromDate > nowDate) {
                return true
            }
        }
        return false
    }else if (ListConfig.user.hasOwnProperty(fromContact.name()) && ListConfig.user[fromContact.name()]) {
        let fromDate = new Date(ListConfig.user[fromContact.name()])
        if (fromDate > nowDate) {
            return true
        }
    }

    return false
}

export async function is_gpt4(msg:Message){
    const fromContact = msg.talker()
    if (ListConfig.gpt4.indexOf(fromContact.name()) > -1) {
        return true
    }
    return false
}
