import { Platform } from 'react-native'


let baseURL = '';

//LOCALHOST
{Platform.OS == 'android'
? baseURL = 'http://192.168.254.111:8000'
: baseURL = 'http://172.20.10.3:8081'
}


// //DEPLOYMENT
// {Platform.OS == 'android'
//     ? baseURL = 'https://financequest-backend-web.onrender.com'
//     : baseURL = 'https://financequest-backend-web.onrender.com'
//     }

export default baseURL;