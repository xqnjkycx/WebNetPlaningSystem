import {
    componentsMap
} from "../js/components.js"
import {
    handlerFn
} from "./../tools/tool.js"

const Green = "#689F38"
const Red = "#F4511E"
const Yellow = "#FFEE58"


class Graph {
    constructor() {
        this.nodes = []
        this.graphMap = new Map()
    }
    setNodes(nodes) {
        this.nodes = nodes
    }
    setMap(graphMap) {
        this.graphMap = graphMap
    }
    addNode(v) {
        this.nodes.push(v)
        this.graphMap.set(v, [])
    }
    addEdge(v1, v2) {
        if (!this.graphMap.get(v1)) {
            this.addNode(v1)
        }
        if (!this.graphMap.get(v2)) {
            this.addNode(v2)
        }
        this.graphMap.get(v1).push(v2)
        this.graphMap.get(v2).push(v1)
    }
    //广度优先搜索运行网络拓扑,这个只会检测端与端之间的连通性
    runGraph(ctx) {
        let queue = []
        let visited = []
        let isError = false
        if (this.nodes.length != 0) {
            queue = [this.nodes[0]]
            while (queue.length != 0) {
                let a = queue.shift()
                visited.push(a)
                this.graphMap.get(a).forEach(b => {
                    if (!visited.includes(b)) {
                        queue.push(b)
                        //如果元件a和元件b都是主机，那么主机直连直接判断为可通
                        if (a.instance.name == "HostComputer" && b.instance.name == "HostComputer") {
                            handlerFn.runline(ctx, Green, a, b)
                        } else if (a.instance.name == "Router" && b.instance.name == "Router") {
                            let routerA = a.instance
                            let routerB = b.instance
                            let isLine = false
                            //找到两个路由器所连接的端口
                            for (let i = 0; i < routerA.portsInfo.length; i++) {
                                for (let j = 0; j < routerB.portsInfo.length; j++) {
                                    if (routerA.portsInfo[i].tag != "" && routerB.portsInfo[j].tag != "" && routerB.portsInfo[j].tag === routerA.portsInfo[i].tag) {
                                        let AportIp = routerA.portsInfo[i].ipAddress
                                        let AportMask = routerA.portsInfo[i].ipMask
                                        let BportIp = routerB.portsInfo[j].ipAddress
                                        let BportMask = routerB.portsInfo[j].ipMask
                                        let AportNet = handlerFn.getNetNumber(AportIp, AportMask)
                                        let BportNet = handlerFn.getNetNumber(BportIp, BportMask)
                                        if (AportNet === BportNet) {
                                            //如果两个路由器的端口ip处于同一个网络中
                                            handlerFn.runline(ctx, Green, a, b)
                                            isLine = true
                                            break;
                                        }
                                    }
                                }
                            }
                            if (!isLine) {
                                handlerFn.runline(ctx, Red, a, b)
                                isError = true
                            }
                        } else {
                            let router;
                            let hostComputer;
                            router = a.instance.name == "Router" ? a.instance : b.instance
                            hostComputer = router === a.instance ? b.instance : a.instance
                            let hostNet = handlerFn.getNetNumber(hostComputer.ipAddress, hostComputer.subnetMask)
                            let portsInfo = router.portsInfo
                            let isLine = false
                            for (let i = 0; i < portsInfo.length; i++) {
                                let item = portsInfo[i]
                                if (item.ipAddress === "" || item.ipMask === "") {
                                    continue
                                } else {
                                    let portIp = item.ipAddress
                                    let portMask = item.ipMask
                                    let portNet = handlerFn.getNetNumber(portIp, portMask)
                                    console.log(portNet, hostNet)
                                    if (portNet === hostNet) {
                                        handlerFn.runline(ctx, Green, a, b)
                                        isLine = true
                                    }
                                }
                            }
                            if (!isLine) {
                                handlerFn.runline(ctx, Red, a, b)
                                isError = true
                            }
                        }
                    }
                })
            }
        }
        return new Promise((resolve, reject) => {
            isError ? reject("出错啦") : resolve("运行成功")
        })
    }
    //查看网络拓扑配置是否健全
    checkGraph() {
        return new Promise((resolve, reject) => {
            if (this.nodes.length != 0) {
                this.nodes.forEach(v => {
                    if (v.instance.name === "HostComputer") {
                        if (v.instance.ipAddress && v.instance.subnetMask) {

                        } else {
                            reject(false)
                        }
                    }
                })
                resolve(true)
            }
        })
    }
    //评分系统
    getGraphScore() {
        //路由器数量
        let routerNum = 0
        //主机数量
        let hostNum = 0
        //网络数组
        let netArr = []
        this.nodes.forEach(node => {
            let instance = node.instance
            if (instance.name === "HostComputer") {
                hostNum++
                let net = handlerFn.getNetNumber(instance.ipAddress, instance.subnetMask)
                if (!netArr.includes(net)) netArr.push(net)
            } else if (instance.name === "Router") {
                routerNum++
                instance.portsInfo.forEach(port => {
                    if (port.ipAddress.length != 0 && port.ipMask.length != 0) {
                        let net = handlerFn.getNetNumber(port.ipAddress, port.ipMask)
                        if (!netArr.includes(net)) netArr.push(net)
                    }
                })
            }
        })
        //稠密度计算
        let adjLists = netArr.length + routerNum * (routerNum - 1) / 2
        let actualAdjLists = 0
        this.graphMap.forEach((value, key) => {
            for (let i = 0; i < value.length; i++) {
                if (key.instance.name == "hostComputer" && key.instance.name == value[i].instance.name) {
                    continue;
                }
                actualAdjLists++
            }
        })
        actualAdjLists = actualAdjLists/2
        let constrctComplexScore =  25 * actualAdjLists/adjLists
        const PI = Math.PI
        let hostNumScore = 20/(3*PI)*(Math.atan(hostNum/2-1)+PI/4)
        let routerNumScore = 140/(3*PI)*(Math.atan(routerNum/2-1)+PI/4)
        let netNumScore = 140/(3*PI)*(Math.atan(netArr.length/2-1)+PI/4)
        let score =  (constrctComplexScore+hostNumScore+routerNumScore+netNumScore).toFixed(2)
        console.log(score)
        return score
    }
    //检测A点是否可以到达B点
    runAtoB(source, target) {
        let targetNet = handlerFn.getNetNumber(target.instance.ipAddress, target.instance.subnetMask)
        let queue = [source]
        let visited = []
        let flag = false
        while (queue.length != 0) {
            let a = queue.shift()
            visited.push(a)
            if (a === target) {
                flag = true
            } else {
                //else if太多了，之后用策略模式重构
                this.graphMap.get(a).forEach(b => {
                    //a是主机,b也是主机
                    if (a.instance.name === "HostComputer" && b.instance.name === "HostComputer") {
                        //a,b都是主机，相当于是直接直连，所以可以ping通
                        if (!visited.includes(b)) {
                            queue.push(b)
                        }
                    }
                    //a是主机,b是路由
                    else if (a.instance.name === "HostComputer" && b.instance.name === "Router") {
                        /**
                         * 路由是否能进入到queue队列，其实是需要看路由器某个端口所处于的网络是否
                         * 和主机所在的网络处于同一网络，如果是处于同一个网络，显然是可以将路由添加到队列中来 
                         */
                        let hostNet = handlerFn.getNetNumber(a.instance.ipAddress, a.instance.subnetMask)
                        //遍历路由的端口信息，查看路由是否有对应的网络
                        for (let i = 0; i < b.instance.portsInfo.length; i++) {
                            let port = b.instance.portsInfo[i]
                            let portNet = handlerFn.getNetNumber(port.ipAddress, port.ipMask)
                            if (portNet === hostNet && !visited.includes(b)) {
                                queue.push(b)
                            }
                        }
                    }
                    //a是路由,b是路由
                    else if (a.instance.name === "Router" && b.instance.name === "Router") {
                        /**
                         * 路由是否能加入到queue队列，需要的是，a的路由表中是否配对了目标的网络地址
                         * 并且ab两个路由器之间的端口标识、所处于的网络是否在同一网段
                         */
                        //遍历路由表，查找是否填入了对应目标网络的地址
                        for (let i = 0; i < a.instance.routingTable.length; i++) {
                            let item = a.instance.routingTable[i]
                            if (item.targetNet === targetNet && item.targetMask === target.subnetMask) {
                                //得出a路由得下一跳地址，然后去b路由中去查找，拿到对应得端口信息后，再做检查
                                let nextJumpIp = item.nextJump
                                b.instance.portsInfo.forEach(portb => {
                                    if (portb.ipAddress === nextJumpIp) {
                                        let tag = portb.tag
                                        a.instance.portsInfo.forEach(porta => {
                                            if (porta.tag === tag) {
                                                let portaNet = handlerFn.getNetNumber(porta.ipAddress, porta.ipMask)
                                                let portbNet = handlerFn.getNetNumber(porta.ipAddress, portb.ipMask)
                                                if (portaNet === portbNet && !visited.includes(b)) {
                                                    queue.push(b)
                                                }
                                            }
                                        })
                                    }
                                })
                            }
                        }
                    }
                    //a是路由,b是主机
                    else if (a.instance.name === "Router" && b.instance.name === "HostComputer") {
                        //查看Router的路由表信息，找到目标网络为targetNet的条目，查看它的下一跳是否是b的ip地址
                        //同时还需要保证，有端口是可以走通的的
                        let hostNet = handlerFn.getNetNumber(b.instance.ipAddress, b.instance.subnetMask)
                        a.instance.routingTable.forEach(item => {
                            if (item.targetNet === targetNet && item.nextJump === b.instance.ipAddress) {
                                //判断是否存在能ping通的端口
                                a.instance.portsInfo.forEach(port => {
                                    let portNet = handlerFn.getNetNumber(port.ipAddress, port.ipMask)
                                    if (portNet === hostNet && !visited.includes(b)) {
                                        queue.push(b)
                                    }
                                })
                            }
                        })
                    }
                })
            }
        }
        return new Promise((resolve, reject) => {
            flag ? resolve() : reject()
        })
    }
    //根据map结构绘制出原本的topo
    static drawTopo(topo, ctx) {
        //整理传进来的topo数据结构
        topo.graphMap = new Map()
        topo.graphArr.forEach(item => {
            let key = item[0]
            let arr = item[1]
            for (let i = 0; i < topo.nodes.length; i++) {
                if (key.instance.id === topo.nodes[i].instance.id) {
                    item[0] = topo.nodes[i]
                    break
                }
            }
            for (let i = 0; i < arr.length; i++) {
                for (let j = 0; j < topo.nodes.length; j++) {
                    if (arr[i].instance.id === topo.nodes[j].instance.id) {
                        arr[i] = topo.nodes[j]
                        break
                    }
                }
            }
            topo.graphMap.set(item[0], item[1])
        })

        //由于实例存放到了本地之后，会导致原型链丢失，所以这里从新产生一个实例
        let graph = new Graph()
        graph.setNodes(topo.nodes)
        graph.setMap(topo.graphMap)
        //开始绘制节点和连线
        //由于这里的绘制只是保存了原型，所以不需要我们去做端口检查，所有的连线都是黄线
        let queue = []
        let visited = []
        queue = [graph.nodes[0]]
        while (queue.length != 0) {
            let a = queue.shift()
            visited.push(a)
            graph.graphMap.get(a).forEach(b => {
                if (!visited.includes(b)) {
                    queue.push(b)
                    handlerFn.runline(ctx, Yellow, a, b)
                }
            })
        }
        return graph
    }
}

export {
    Graph
}