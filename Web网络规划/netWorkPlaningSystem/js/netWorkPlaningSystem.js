import {
    generateComponentsFactory,
    componentsMap,
} from "./components.js"
import {
    setupCanvas,
    handlerFn
} from "../tools/tool.js"
import {
    Graph
} from "./../tools/Graph.js";
import {
    formatTopo,
    saveTopo1
} from './../tools/storage.js'




var vue = new Vue({
    el: '#netWorkPlaningSystem',
    data: function () {
        return {
            identity:"",
            loading: false,
            //控制router设置信息弹出
            alertSetRouterInfoFlag: false,
            //控制路由表的设置信息弹出
            alertSetRoutingTableFlag: false,
            //控制保存网络的弹出
            alertReadTopoFlag: false,
            //控制查询学生作业的弹出:
            alertSearchHomeWorkFlag:false,
            //控制查看学生作业的弹出:
            alertWatchHomeWorkFlag:false,
            //控制教师评分的作业弹出
            alertgiveScoreFlag:false,
            //控制学生查看评分弹出
            alertStudentWatchSocreFlag:false,
            //学生查看提交网络的标志位
            studentWatchSubmitNet:false,
            routerArr: [],
            routerTable: null,
            routerPorts: null,
            studentsTopoInfo: [],
            classnum:'',
            classes:[],
            student:'',
            studentId:'',
            students:[],
            score:'',
            comment:'',
            studentdis:true,
            netTopoName:"",

            systemScore:0,
            teacherScore:"暂无",
            teacherComment:"暂无",
        }
    },
    methods: {
        selectTopo(name) {
            this.studentWatchSubmitNet?getTopoConstrunct(name,id,TEACHER) : getTopoConstrunct(name,id,identity)
        },
        submitScoreAndComment(){
            axios({
                method:"POST",
                url:"http://localhost:3000/submitScore",
                data:{
                    toponame:this.netTopoName,
                    comment:this.comment,
                    score:this.score,
                    id:id
                }
            }).then(res=>{
                this.comment = ""
                this.score = ""
                this.alertgiveScoreFlag = false
            })
        }
    },
    computed:{
        disSearchBtn:function(){
            if(this.student.length !=0 && this.classnum.length!=0){
                return false
            }
            return true
        },
        disSubmitScore:function(){
            if(this.score.length != 0) return false
            return true
        },
        disSubmitScoreBtn:function(){
            if(this.netTopoName.length != 0) return false
            return true
        }
    },
    watch:{
        classnum:function(newVal,oldVal){
            let self = this;
            this.student = ""
            axios({
                method:"POST",
                url:"http://localhost:3000/getStudent",
                data:{
                    classnum:newVal
                }
            }).then(res=>{
                self.students = res.data
                self.studentdis = false
            })
        }
    }
})



//全局图
let netTopo = new Graph()
let ctx
//学生id
let id
//教师名称
let teacher
//身份变量
let identity

//指令名称
const READY = "ready" //ready --- 表示等待操作
const ADDCOMPONENT = "addcomponent" // addcomponent --- 表示添加元件到画布上
const ADDLINE = "addline" //addline --- 准备给元件与元件之间添加连线
const ENVELOPE = "envelope" //envelope --- 信封指令,测试两台主机之间是否可以ping通

//身份常量
const TEACHER = "teacher"
const STUDENT = "student"

// 连线控制
const DRAWLINESTART = "drawlinestart"
const DRAWLINEEND = "drawlineend"

let command = READY //初始化指令为等到操作
let drawline = DRAWLINESTART //初始换连线控制
let componentName = null

let nodes = [] //连线需要记录两个点，以便于能正确加入到图中

let lists = [] //信封点击，需要两个节点，分别是起点和终点




window.onload = function () {
    initSystem()
    initCanvas()
    initEventListener()
}

//初始化系统操作
function initSystem() {
    //取消系统自带的右键点击事件
    document.oncontextmenu = function (e) {
        return false
    }
    //接收跳转过来的参数
    let hashArr = window.location.hash.split("/")
    let radio = hashArr[2]
    //身份确认流程
    if (radio === "1") {
        id = hashArr[1]
        identity = vue._data.identity = STUDENT
    } else if (radio === "2") {
        teacher = hashArr[1]
        identity =vue._data.identity = TEACHER
    }
    //权限控制 移除 部分按钮
    [...document.getElementsByName('theBtn')].forEach(btn=>{
        let permission = btn.getAttribute('permission')
        if( permission && vue._data.identity != permission){
            let deleteEle = btn.parentNode
            deleteEle.parentNode.removeChild(deleteEle)
            //btn.parentNode.removeChild(btn)
        }
    })
}

//初始化canvas画布事件
function initCanvas() {
    let clickflag //防止双击事件触发单击事件
    const canvas = document.getElementById('canvas');
    ctx = setupCanvas(canvas)
    const parentElementStyle = window.getComputedStyle(canvas.parentElement)
    canvas.height = parseInt(parentElementStyle.height)
    canvas.width = parseInt(parentElementStyle.width)
    canvas.style.background = "#E0E0E0"
    const rect = canvas.getBoundingClientRect()
    canvas.addEventListener("click", function (event) {
        clickflag && clearTimeout(clickflag)
        clickflag = setTimeout(() => {
            var x = event.clientX - rect.left * (canvas.width / rect.width);
            var y = event.clientY - rect.top * (canvas.height / rect.height);
            //指令是添加元件的处理情况
            if (command === ADDCOMPONENT) {
                //如果指令是 添加元件 那么点击canvas应该添加对应的元件类到画布上
                let componentPosition = {
                    x,
                    y
                }
                let instance = generateComponentsFactory.generate(componentName, ctx, componentPosition)
                if (instance.name == "Router") {
                    vue._data.routerArr.push(instance)
                }
            }
            //指令是添加连线的处理情况
            else if (command === ADDLINE) {
                setTimeout(() => {
                    componentsMap.forEach((component, area) => {
                        if (x >= area.start && x <= area.startEnd && y >= area.origin && y <= area.originEnd) {
                            if (drawline === DRAWLINESTART) {
                                handlerFn.drawLine(ctx, {
                                    x: (area.start + area.startEnd) / 2,
                                    y: (area.origin + area.originEnd) / 2
                                }, drawline)
                                drawline = DRAWLINEEND
                                nodes.push(component)
                            } else if (drawline === DRAWLINEEND) {
                                handlerFn.drawLine(ctx, {
                                    x: (area.start + area.startEnd) / 2,
                                    y: (area.origin + area.originEnd) / 2
                                }, drawline)
                                drawline = DRAWLINESTART
                                nodes.push(component)
                                //加入到图中
                                handlerFn.drawGraph(netTopo, nodes)
                                nodes = []
                            }
                        }
                    })
                })
            } else if (command === ENVELOPE) {
                setTimeout(() => {
                    componentsMap.forEach((component, area) => {
                        if (x >= area.start && x <= area.startEnd && y >= area.origin && y <= area.originEnd) {
                            lists.push(component)
                            if (lists.length === 2) {
                                netTopo.runAtoB(lists[0], lists[1]).then(() => {
                                    swal({
                                        title: "成功啦",
                                        text: "同学恭喜你！两台主机之间能进行正常通信哦~",
                                        icon: "success",
                                        button: "ok"
                                    }).then(() => {
                                        lists.length = 0
                                    })
                                }, () => {
                                    swal({
                                        title: "无法ping通",
                                        text: "请仔细检查路由表及其其它信息是否配对",
                                        icon: "error",
                                        button: "我明白了"
                                    }).then(() => {
                                        lists.length = 0
                                    })
                                })
                            }
                        }
                    })
                })
            } else if (command === READY) {
                setTimeout(() => {
                    componentsMap.forEach((component, area) => {
                        if (x >= area.start && x <= area.startEnd && y >= area.origin && y <= area.originEnd) {
                            let instance = component.instance
                            if (instance.name === "HostComputer") {
                                alertIpPromise(instance)
                            }
                            if (instance.name === "Router") {
                                alertSetRoterInfo(instance)
                            }
                        }
                    })
                })
            }
        }, 200)
    })
    //双击事件，查看配置
    canvas.addEventListener("dblclick", function (event) {
        clearTimeout(clickflag);
        if (command === READY) {
            var x = event.clientX - rect.left * (canvas.width / rect.width);
            var y = event.clientY - rect.top * (canvas.height / rect.height);
            componentsMap.forEach((component, area) => {
                if (x >= area.start && x <= area.startEnd && y >= area.origin && y <= area.originEnd) {
                    let instance = component.instance
                    if (instance.name === "HostComputer") {
                        let defaultStr = "未配置"
                        let info = `ip地址:${instance.ipAddress === null ? defaultStr : instance.ipAddress}-----掩码值为:${instance.subnetMask === null ? defaultStr : instance.subnetMask}`
                        swal({
                            title: "配置信息",
                            text: info,
                            button: "OK"
                        })
                    }
                    if (instance.name === "Router") {
                        alertSetRoutingTable(instance)
                    }
                }
            })
        }
    })
}

//初始化常见事件监听
function initEventListener() {
    let borderCard = document.getElementById("border-card")
    let oImgs = borderCard.querySelectorAll("img")
    //元件点击事件
    oImgs.forEach(img => {
        img.addEventListener("click", function () {
            command = ADDCOMPONENT
            if (img.name === "Line") command = ADDLINE
            if (img.name === "Envelope") command = ENVELOPE
            componentName = img.name
            //控制选中样式和清除样式
            if (img.getAttribute('class')) {
                img.removeAttribute('class')
            } else {
                oImgs.forEach(i => {
                    i.removeAttribute('class')
                })
                img.className = "check-in"
            }

            //点击对应的元件图片,图片会跟随鼠标
            document.addEventListener('mousemove', function (event) {
                if (command === ADDCOMPONENT || command === ADDLINE || command === ENVELOPE) {
                    handlerFn.componentIamgeFollowMouse(event)
                }
            })
            let oImg = document.getElementById("componentIcon")
            //如果再次点击元件图片，说明不再做选元件添加到画布中去了
            if (oImg && oImg.src == img.src) {
                oImg.parentElement.removeChild(oImg)
                resetCommand()
            } else {
                if (oImg) oImg.parentElement.removeChild(oImg)
                let componentIcon = document.createElement("img")
                componentIcon.src = img.src
                componentIcon.style.width = "65px"
                componentIcon.style.height = "65px"
                componentIcon.style.opacity = 0.6
                componentIcon.style.position = "absolute"
                componentIcon.style.zIndex = 999
                componentIcon.id = "componentIcon"
                document.body.appendChild(componentIcon)
            }
        })
    })

    initRunNetButton()
    if(identity == STUDENT){
        initRestTopoEvent()
        initWatchScoreEvent()
        initSaveTopoEvent()
        initReadTopoEvent()
        initReadHomeWorkEvent()
        initSubmitTopoEvent()
    }else if(identity == TEACHER){
        initSearchHomeWorkEvent()
        initSubmitScoreEvent()
    }
}

//运行网络事件
function initRunNetButton() {
    let runNetBtn = document.getElementById("runNetBtn")
    runNetBtn.addEventListener("click", function () {
        if (command = READY) {
            netTopo.checkGraph()
                .then(() => {
                    vue._data.loading = true
                    setTimeout(() => {
                        vue._data.loading = false
                        netTopo.runGraph(ctx).then(() => {
                            swal({
                                title: "成功啦",
                                text: "元件之间通信正常",
                                icon: "success",
                                button: "ok"
                            })
                        }, () => {
                            swal({
                                title: "异常啦",
                                text: "红线初代表您的两端元件有异常不能正常通信，请仔细检查",
                                icon: "warning",
                                button: "ok"
                            })
                        })
                    }, 1500)
                }, () => {
                    swal({
                        title: "配置错误",
                        text: "您有主机未配置IP或掩码",
                        icon: "warning",
                        button: "我明白了"
                    })
                })
        }
    })
}
//学生专用 获取系统评分
function initWatchScoreEvent(){
    document.getElementById("watchScoreBtn").addEventListener("click",function(){
        vue._data.alertStudentWatchSocreFlag = true
        try{
            vue._data.systemScore = netTopo.getGraphScore()   
        }catch(error){
            vue._data.systemScore = "拓扑网络中存在一些错误，系统无法正确打分"
        }
        vue._data.teacherComment = "暂无"
        vue._data.teacherScore = "暂无"
        axios({
            method:"POST",
            url:"http://localhost:3000/getScoreAndComment",
            data:{
                id:id,
                toponame:vue._data.netTopoName
            }
        }).then(res=>{
            if(res.data.length == 0){
                //说明找不到表
            }else{
                if(res.data[0].score) vue._data.teacherScore = res.data[0].score
                if(res.data[0].score) vue._data.teacherComment = res.data[0].comment
            }
        })
    })
}
//学生专用 重置网络事件
function initRestTopoEvent() {
    document.getElementById("resetTopoBtn").addEventListener("click", function () {
        const canvas = document.getElementById('canvas');
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        vue._data.routerArr.length = 0
        netTopo = new Graph()
        componentsMap.clear()
    })
}
//学生专用 保存网络事件
function initSaveTopoEvent() {
    document.getElementById("saveTopoBtn").addEventListener("click", function () {
        alertSaveTopo("保存网络","saveTopo")
    })
}
//学生专用 读取网络事件
function initReadTopoEvent() {
    document.getElementById("readTopoBtn").addEventListener("click", function () {
        //发送请求，查询用户保存了哪些网络
        vue._data.studentWatchSubmitNet = false
        vue._data.alertReadTopoFlag = true;
        axios({
            method: "POST",
            url: "http://localhost:3000/readTopo",
            data: {
                userid: id,
                target:"saveTopo"
            }
        }).then(res => {
            vue._data.studentsTopoInfo = res.data
            vue._data.studentsTopoInfo.forEach(obj => {
                obj.imgUrl = localStorage.getItem(obj.topoName)
            })
        })
    })
}
//学生获取已提交的作业
function initReadHomeWorkEvent(){
    document.getElementById("readSubmitnetBtn").addEventListener("click",function(){
        vue._data.alertReadTopoFlag = true;
        vue._data.studentWatchSubmitNet = true
        axios({
            method:"POST",
            url:"http://localhost:3000/readTopo",
            data:{
                userid:id,
                target:"submitTopo"
            }
        }).then(res=>{
            vue._data.studentsTopoInfo = res.data
            vue._data.studentsTopoInfo.forEach(obj=>{
                obj.imgUrl = localStorage.getItem(obj.topoName)
            })
        })
    })
}
//学生专用 提交网络事件
function initSubmitTopoEvent(){
    document.getElementById("submitTopoBtn").addEventListener("click",function(){
        alertSaveTopo("提交网络","submitTopo")
    })
}
//教师专用 查看班级和学生
function initSearchHomeWorkEvent(){
    document.getElementById("searchHomeworkBtn").addEventListener("click",()=>{
        axios({
            method:"POST",
            url:"http://localhost:3000/getClass",
            data:{
                teachername:teacher
            }
        }).then(res=>{
          vue._data.classes = res.data
          vue._data.alertSearchHomeWorkFlag = true  
        }).then(()=>{
            initSearchEvent()
        })
    })
}

//教师专用 查询某具体学生的作业
function initSearchEvent(){
    document.getElementById("searchBtn").addEventListener("click",()=>{
        vue._data.students.forEach(student=>{
            if(vue._data.student == student.studentname){
                id = student.id
                vue._data.alertReadTopoFlag = true;
                axios({
                    method: "POST",
                    url: "http://localhost:3000/readTopo",
                    data: {
                        userid: id,
                        target:"submitTopo"
                    }
                }).then(res => {
                    vue._data.studentsTopoInfo = res.data
                    vue._data.studentsTopoInfo.forEach(obj => {
                        obj.imgUrl = localStorage.getItem(obj.topoName)
                    })
                })
            }
        })
    })
}

//教师专用上传评分
function initSubmitScoreEvent(){
    document.getElementById("submitScoreBtn").addEventListener("click",function(){
        vue._data.alertgiveScoreFlag = true
    })
}

//从后台获取具体的网络拓扑结构
function getTopoConstrunct(name, id,identity) {
    vue._data.netTopoName = name
    axios({
        method: "POST",
        url: "http://localhost:3000/getTopo",
        data: {
            userid: id,
            toponame: name,
            identity:identity
        }
    }).then(res => {
        vue._data.alertSearchHomeWorkFlag = false
        vue._data.alertReadTopoFlag = false
        let topo = formatTopo(JSON.parse(res.data[0].topo))
        const canvas = document.getElementById('canvas');
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        componentsMap.clear()
        for (let i = 0; i < topo.nodes.length; i++) {
            let item = topo.nodes[i]
            let instance = generateComponentsFactory.generate(item.instance.name, ctx, item.instance.positionObj)
            //由于这是新产生出来的实例，所以一些ip地址和掩码的配置需要重新渲染一遍
            if (instance.name === "HostComputer") {
                instance.ipAddress = item.instance.ipAddress
                instance.subnetMask = item.instance.subnetMask
            } else if (instance.name === "Router") {
                instance.portsInfo = item.instance.portsInfo
                instance.routingTable = item.instance.routingTable
            }
        }
        let nodeslength = topo.nodes.length
        topo.nodes.length = 0
        //由于componentsMap的更新是 耗时操作
        //所以这里需要开启进行一个异步操作
        let timer = setInterval(() => {
            if (nodeslength === componentsMap.size) {
                clearInterval(timer)
                componentsMap.forEach(component => {
                    topo.nodes.push(component)
                })
                vue._data.routerArr.length = 0 //记录router的数组清空，并且之后进行重新push
                netTopo = Graph.drawTopo(topo, ctx)
                netTopo.nodes.forEach(item => {
                    let instance = item.instance
                    if (instance.name === "Router") {
                        vue._data.routerArr.push(instance)
                    }
                })
            }
        }, 500)
    })
}

function resetCommand() {
    command = READY
    drawline = DRAWLINESTART
    nodes.length = 0
    lists.length = 0
}
//IP地址输入框
function alertIpPromise(instance) {
    return new Promise((resolve, reject) => {
        swal({
            title: "主机ip配置",
            content: {
                element: "input",
                attributes: {
                    placeholder: "请输入IP地址",
                    type: "text",
                },
            },
            buttons: {
                cancel: "取消",
                confirm: {
                    text: "保存",
                },
            },
        }).then(ip => {
            if (ip === "") {
                reject(null)
            } else {
                if (ip != null) {
                    handlerFn.checkIp(ip) === false ? reject(ip) : resolve(ip)
                }
            }
        })
    }).then(ip => {
        instance.setIpAddress(ip)
        alertMarkPromise(instance)
    }, err => {
        swal({
            title: "出错啦！",
            text: "您没有输入地址或输入的地址格式有误,请仔细检查",
            icon: "error",
            button: "我明白了"
        }).then(() => {
            alertIpPromise(instance)
        })
    })
}
//子网掩码地址输入框
function alertMarkPromise(instance) {
    return new Promise((resolve, reject) => {
        swal({
            title: "主机掩码配置",
            content: {
                element: "input",
                attributes: {
                    placeholder: "请输入子网掩码",
                    type: "text",
                },
            },
            buttons: {
                cancel: "取消",
                confirm: {
                    text: "保存",
                },
            },
        }).then(mark => {
            if (mark === "") {
                reject(null)
            } else {
                if (mark != null) {
                    handlerFn.checkIp(mark) === false ? reject(mark) : resolve(mark)
                }
            }
        })
    }).then(mark => {
        instance.setSubnetMask(mark)
    }, err => {
        swal({
            title: "出错啦！",
            text: "您未输入地址或输入的地址格式有误,请仔细检查",
            icon: "error",
            button: "我明白了"
        }).then(() => {
            alertMarkPromise(instance)
        })
    })
}
//保存网络名
function alertSaveTopo(title,connector) {
    new Promise((resolve, reject) => {
        swal({
            title: title,
            content: {
                element: "input",
                attributes: {
                    placeholder: "为你的网络取一个名字",
                    type: "text",
                },
                buttons: {
                    cancel: "取消",
                    confirm: {
                        text: "保存",
                    },
                },
            },

        }).then(name => {
            if (name === "") {
                reject()
            } else {
                resolve(name)
            }
        })
    }).then(name => {
        //1.获取到用户的给网络拓扑取的名字
        let topoName = name
        //2.获取学生的学号
        let studentId = id
        //3.截图
        const node = document.getElementById('el-main');
        domtoimage.toPng(node)
            .then(function (dataUrl) {
                //4.存入本地
                localStorage.setItem(topoName, dataUrl)
            })

        saveTopo1(name, id, netTopo,connector)
    }, () => {
        swal({
            title: "出错啦！",
            text: "名字不能为空",
            icon: "error",
            button: "我明白了"
        }).then(() => {
            alertSaveTopo()
        })
    })
}
//router端口设置
function alertSetRoterInfo(instance) {
    vue._data.routerArr.forEach((router) => {
        if (router === instance) {
            vue._data.routerPorts = instance.portsInfo
            vue._data.alertSetRouterInfoFlag = true
        }
    })
}
//router路由表条目设置
function alertSetRoutingTable(instance) {
    vue._data.routerArr.forEach((router) => {
        if (router === instance) {
            vue._data.routerTable = instance.routingTable
            vue._data.alertSetRoutingTableFlag = true
        }
    })
}