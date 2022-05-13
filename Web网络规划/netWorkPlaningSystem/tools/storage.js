// function saveTopo(name="default-topo",topo){
//     //由于topo是内含了map对象所以这里要对topo进行转换为对象的处理
//     let value = _mapToObject(topo)
//     localStorage.setItem(name,JSON.stringify(value))
// }

function saveTopo1(name,id,topo,connector){
    let value = JSON.stringify(_mapToObject(topo))
    value += ""
    axios({
        method:"POST",
        url:`http://localhost:3000/${connector}`,
        data:{
            userid:id,
            topoName:name,
            topo:value
        }
    }).then(res=>{
        res.data.message ? alert("操作成功") : alert("操作失败")
    })
}

function formatTopo(topo){
    let value = {}
    value.nodes = topo.nodes
    value.graphArr = topo.graphmap
    return value
}

// function readTopo(name="default-topo"){
//     let instance = localStorage.getItem(name)
//     return _objectToMap(JSON.parse(instance))
// }

function _mapToObject(topo){
    let value = {}
    value.nodes = topo.nodes;
    value.graphmap = []
    topo.graphMap.forEach((item,key)=>{
        value.graphmap.push([key,item])
    })
    return value
}

function _objectToMap(obj){
    let value = {}
    value.nodes = obj.nodes
    value.graphArr = obj.graphmap
    return value
}

export{saveTopo1,formatTopo}
