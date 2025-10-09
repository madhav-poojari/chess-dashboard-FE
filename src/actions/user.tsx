// import fetch from "isomorphic-fetch";
// import { API } from "../config.js";

export const userPublicProfile = () => {
    // return fetch(`${API}/api/user/${username}`, {
    //     method: 'GET',
    //     headers: {
    //         Accept: 'application/json',

    //     }
    // })
    //     .then(response => {
    //         return response.json();
    //     })
    //     .catch(error => console.log(error));
    setTimeout(()=>{},5000)
    return {
        first_name:"Madhava",
        last_name:"Poojari",
        email:"madhava.poojari6@gmail.com",
        uid:"RZ7560",
        bio:"Scooby Dooby Doo!",
        country: "India",
        city: "HYD",
        state: "TS",
        postal_code: "500009",

    }
};
// S20200020291