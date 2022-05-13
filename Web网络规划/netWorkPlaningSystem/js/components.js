let componentsMap = new Map()
//创建一个 元件Mapper

//工厂模式
//用于产生出具体的网络元件
class generateComponentsFactory {
    static generate(componentName, ctx, componentPosition) {
        if (componentName === "Router") {
            return new Router(ctx, "./../../images/luyou1.png", 50, 40, componentPosition)

        }
        if (componentName === "HostComputer") {
            return new HostComputer(ctx, "./../../images/zhuji.png", 65, 65, componentPosition)
        }
    }
}

class InternetComponents {
    constructor(ctx, imgUrl, width, height, componentPosition) {
        this.ctx = ctx
        this.imgUrl = imgUrl
        this.imgWidth = width
        this.imgHeight = height
        this.positionObj = componentPosition
        this.initComponentViewToCanvas(this.ctx, this.imgUrl, this.imgWidth, this.imgHeight, this.positionObj)
    }
    //将图片绘制到canvas的方法
    initComponentViewToCanvas(ctx, imgUrl, width, height, positionObj) {
        let {
            x,
            y
        } = positionObj
        let self = this
        const img = document.createElement('img')
        img.src = imgUrl
        //绘制区域
        let imgPostion = {
            start: x,
            startEnd: x + width,
            origin: y,
            originEnd: y + height
        }
        img.onload = function () {
            ctx.drawImage(img, x, y, width, height)
            if (self) {
                componentsMap.set(imgPostion, {
                    instance: self, //实例
                    position: imgPostion //元素所在canvas的位置信息
                })

            }
        }
    }
}

class HostComputer extends InternetComponents {
    constructor(ctx, imgUrl, width, height, componentPosition) {
        super(ctx, imgUrl, width, height, componentPosition)
        this.ipAddress = null
        this.subnetMask = null
        this.name = "HostComputer"
        this.id = this.name + this.positionObj.x + this.positionObj.y
    }
    setIpAddress(address) {
        this.ipAddress = address
    }
    setSubnetMask(mask) {
        this.subnetMask = mask
    }
}

class Router extends InternetComponents {
    constructor(ctx, imgUrl, width, height, componentPosition) {
        super(ctx, imgUrl, width, height, componentPosition)
        this.name = "Router"
        this.id = this.name + this.positionObj.x + this.positionObj.y
        this.portsInfo = [{
                    name: "端口1",
                    ipAddress: "",
                    ipMask: "",
                    tag: ""
                },
                {
                    name: "端口2",
                    ipAddress: "",
                    ipMask: "",
                    tag: ""
                },
                {
                    name: "端口3",
                    ipAddress: "",
                    ipMask: "",
                    tag: ""
                },
                {
                    name: "端口4",
                    ipAddress: "",
                    ipMask: "",
                    tag: ""
                },
                {
                    name: "端口5",
                    ipAddress: "",
                    ipMask: "",
                    tag: ""
                },
                {
                    name: "端口6",
                    ipAddress: "",
                    ipMask: "",
                    tag: ""
                },
        ],
        this.routingTable = [{
                name: "条目1",
                targetNet: "",
                targetMask: "",
                nextJump: ""
            }, {
                name: "条目2",
                targetNet: "",
                targetMask: "",
                nextJump: ""
            }, {
                name: "条目3",
                targetNet: "",
                targetMask: "",
                nextJump: ""
            }, {
                name: "条目4",
                targetNet: "",
                targetMask: "",
                nextJump: ""
            }, {
                name: "条目5",
                targetNet: "",
                targetMask: "",
                nextJump: ""
            }, {
                name: "条目6",
                targetNet: "",
                targetMask: "",
                nextJump: ""
            }, {
                name: "条目7",
                targetNet: "",
                targetMask: "",
                nextJump: ""
            },{
                name: "条目8",
                targetNet: "",
                targetMask: "",
                nextJump: ""
            }]
    }
}


export {
    generateComponentsFactory,
    componentsMap
}