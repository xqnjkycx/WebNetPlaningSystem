let vue = new Vue({
    el: "#app",
    data() {
        return {
            userid: "",
            classid: "",
            password: "",
            radio: "1",
            teachername:"",
        }
    },
    computed:{
        loginBtndisabled(){
            if(this.radio === "1"){
                if(this.userid.length !=0 && this.classid.length != 0 && this.password.length != 0){
                    return false
                }
            }
            if(this.radio === "2" && this.teachername.length != 0){
                return false
            }
            return true
        }
    }
})

window.onload = function () {
    //登录事件
    document.getElementById("loginBtn").addEventListener("click", function () {
        let radio = vue._data.radio
        if(radio === "1"){
            let userid = vue._data.userid
            let classid = vue._data.classid
            let password = vue._data.password
            axios({
                    method: "POST",
                    url: "http://localhost:3000/login",
                    data: {
                        userid,
                        classid,
                        password
                    }
                })
                .then(res => {
                    let data = res.data
                    if(data.result.length === 1 && data.success==="success"){
                        let id = data.result[0].id
                        window.location.href = `http://127.0.0.1:5500/netWorkPlaningSystem/netWorkPlaningSystem.html#/${id}/${radio}`
                    }
                })
                .catch(err => {
                    console.log(err)
                })
        }else if(radio === "2"){
            let teacher = vue._data.teachername
            window.location.href = `http://127.0.0.1:5500/netWorkPlaningSystem/netWorkPlaningSystem.html#/${teacher}/${radio}`
        }
    })
}