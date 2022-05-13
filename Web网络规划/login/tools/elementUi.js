new Vue({
    el:"#index",
    data:function(){
        return{
            username:"",
            password:"",
            radio:"1",
            disabled:true
        }
    },
    watch:{
        username:function(){
            if(this.username.trim().length != 0 && this.password.trim().length != 0){
                this.disabled = false    
            }
        },
        password:function(){
            if(this.username.trim().length != 0 && this.password.trim().length != 0){
                this.disabled = false    
            }
        }
    }
})

