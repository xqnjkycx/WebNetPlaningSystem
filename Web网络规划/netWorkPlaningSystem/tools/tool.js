//防止插入的图片变得特别模糊
function setupCanvas(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return ctx;
}

const handlerFn = {
    //元件图片跟随鼠标
    componentIamgeFollowMouse: function (e) {
        var x = e.pageX
        var y = e.pageY
        var pic = document.querySelector("#componentIcon")
        pic.style.left = x + 6 + 'px'
        pic.style.top = y + 5 + 'px'
    },
    //绘制连线
    drawLine: function (ctx, Point, drawCommand) {
        if (drawCommand === "drawlinestart") {
            ctx.beginPath()
            ctx.moveTo(Point.x, Point.y)
        }
        if (drawCommand === "drawlineend") {
            ctx.lineTo(Point.x, Point.y)
            ctx.lineWidth = 2
            ctx.strokeStyle = "#FFEE58"
            ctx.lineCap = "round"
            ctx.stroke()
            ctx.closePath()
        }
    },
    runline: function (ctx, color, A, B) {
        //绘制对于颜色的线
        ctx.beginPath()
        ctx.moveTo((A.position.start + A.position.startEnd) / 2, (A.position.origin + A.position.originEnd) / 2)
        ctx.lineTo((B.position.start + B.position.startEnd) / 2, (B.position.origin + B.position.originEnd) / 2)
        ctx.lineWidth = 2
        ctx.strokeStyle = color
        ctx.stroke()
        ctx.closePath()
    },
    //检查IP格式
    checkIp: function (ip) {
        let arr = ip.split(".")
        let res = true
        if (arr.length != 4) {
            res = false
        }
        for (let code of arr) {
            if (parseInt(code) < 0 || parseInt(code) > 255) {
                res = false
            }
        }
        return res
    },
    //构建网络拓扑的数据结构
    drawGraph: function (graph, [v1, v2]) {
        graph.addEdge(v1, v2)
    },
    //判断两台主机是否存在与同一个网段
    isIntheSameNet(A, B) {
        let ipA = A.ipAddress.split(".").map(num => parseInt(num))
        let ipB = B.ipAddress.split(".").map(num => parseInt(num))
        let maskA = A.subnetMask.split(".").map(num => parseInt(num))
        let maskB = B.subnetMask.split(".").map(num => parseInt(num))
        let netA = ""
        let netB = ""
        for (let i = 0; i < 4; i++) {
            netA = netA + (ipA[i] & maskA[i])
            netB = netB + (ipB[i] & maskB[i])
        }
        return netA == netB
    },
    //获取元件所在网络
    getNetNumber(ip, mask) {
        let netNumber = []
        let ipNumber = ip.split(".").map(num => parseInt(num))
        let maskNumber = mask.split(".").map(num => parseInt(num))
        for (let i = 0; i < 4; i++) {
            netNumber[i] = ipNumber[i] & maskNumber[i]
        }
        return netNumber.join(".");
    },
    //将dom节点转换为图片
    generateImg(node) {
        domtoimage.toJpeg(node, { quality: 0.6 })
        .then(function (dataUrl) {
            console.log(dataUrl)
         var link = document.createElement('a');
         link.download = 'my-image-name.jpeg';
         link.href = dataUrl;
         link.click();
    });
    }
}


export {
    setupCanvas,
    handlerFn
}