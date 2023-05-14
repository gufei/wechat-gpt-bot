
import type {Message} from "wechaty";


export async function auth(msg:Message){
    // 这里实现独立的验证逻辑，默认放开所有
    return true
}
