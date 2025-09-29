(function () {
  const svg = d3.select("#canvas");
  const g = svg.append("g");

  // ---------- 数据区：根据你的内容调整 ----------
  // type: 'core' | 'solid' | 'hollow' | 'black'
  // r: 半径；x,y：坐标
  const nodes = [
    { id:"borders", label:"PIZZA", sub:"Object of study", x:260, y:220, r:90, type:"core" },

    { id:"data", label:"DATA & ASSUMPTIONS", sub:"Origins · Distances · Emission factors", x:640, y:170, r:80, type:"hollow" },
    { id:"model", label:"COMPUTATION", sub:"LCA · GIS · Scenarios", x:640, y:410, r:100, type:"black" },
    { id:"outputs", label:"DESIGN OUTPUTS", sub:"Interactive Map · Carbon Receipt · Menu · Installation", x:980, y:210, r:110, type:"hollow" },
    { id:"public", label:"PUBLIC ENGAGEMENT", sub:"Experiential dinner · Workshop · Polls", x:1260, y:340, r:95, type:"black" },

    // 子主题（示例）
    { id:"ing", label:"Ingredients", sub:"Wheat · Cheese · Tomato", x:450, y:120, r:58, type:"solid" },
    { id:"transport", label:"Transport", sub:"Truck · Rail · Ship", x:460, y:260, r:54, type:"solid" },
    { id:"lca", label:"LCA", sub:"Production · Processing", x:540, y:450, r:52, type:"solid" },
    { id:"gis", label:"GIS", sub:"Routes · Distance · Mode", x:740, y:450, r:52, type:"solid" },
    { id:"map", label:"Map", sub:"Flow thickness ≈ CO₂e", x:960, y:90, r:46, type:"solid" },
    { id:"receipt", label:"Carbon Receipt", sub:"Per-slice & per-ingredient", x:1090, y:110, r:46, type:"solid" },
    { id:"menu", label:"Menu", sub:"CO₂e-labelled", x:1050, y:300, r:46, type:"solid" },
  ];

  // 连线（source → target）
  const links = [
    ["borders", "data"],
    ["borders", "model"],
    ["data", "model"],
    ["model", "outputs"],
    ["outputs", "public"],
    // 反馈回路
    ["public", "data"],

    // 子主题连接
    ["data","ing"], ["data","transport"],
    ["model","lca"], ["model","gis"],
    ["outputs","map"], ["outputs","receipt"], ["outputs","menu"]
  ];

  // 虚线环（orbits）- 定义围绕主要节点的轨道
  const orbits = [
    { center: "borders", radius: 180 },  // 围绕核心节点的轨道
    { center: "model", radius: 150 },    // 围绕计算节点的轨道
    { center: "outputs", radius: 170 }   // 围绕输出节点的轨道
  ];

  // ---------- 渲染函数 ----------
  
  // 1. 绘制轨道（虚线圆）
  const orbitGroup = g.append("g").attr("class", "orbits");
  orbits.forEach(orbit => {
    const centerNode = nodes.find(n => n.id === orbit.center);
    if (centerNode) {
      orbitGroup.append("circle")
        .attr("class", "orbit")
        .attr("cx", centerNode.x)
        .attr("cy", centerNode.y)
        .attr("r", orbit.radius);
    }
  });

  // 2. 绘制连接线
  const linkGroup = g.append("g").attr("class", "links");
  links.forEach(link => {
    const source = nodes.find(n => n.id === link[0]);
    const target = nodes.find(n => n.id === link[1]);
    
    if (source && target) {
      linkGroup.append("line")
        .attr("class", "link")
        .attr("x1", source.x)
        .attr("y1", source.y)
        .attr("x2", target.x)
        .attr("y2", target.y);
    }
  });

  // 3. 绘制节点
  const nodeGroup = g.append("g").attr("class", "nodes");
  
  nodes.forEach(node => {
    const nodeG = nodeGroup.append("g")
      .attr("class", `node ${node.type}`)
      .attr("transform", `translate(${node.x}, ${node.y})`);

    // 绘制圆圈
    nodeG.append("circle")
      .attr("r", node.r);

    // 主标签
    nodeG.append("text")
      .attr("class", node.type === "core" || node.type === "black" ? "label inverse" : "label")
      .attr("y", -8)
      .text(node.label);

    // 副标签
    if (node.sub) {
      nodeG.append("text")
        .attr("class", "subtext")
        .attr("y", 8)
        .text(node.sub);
    }
  });

  // 4. 添加交互性（可选）
  nodeGroup.selectAll(".node")
    .style("cursor", "pointer")
    .on("mouseover", function(event, d) {
      d3.select(this).select("circle")
        .style("stroke-width", "2px");
    })
    .on("mouseout", function(event, d) {
      d3.select(this).select("circle")
        .style("stroke-width", "1.2px");
    });

  // 5. 设置 SVG 视图框以居中内容
  const padding = 50;
  const minX = d3.min(nodes, d => d.x - d.r) - padding;
  const maxX = d3.max(nodes, d => d.x + d.r) + padding;
  const minY = d3.min(nodes, d => d.y - d.r) - padding;
  const maxY = d3.max(nodes, d => d.y + d.r) + padding;
  
  svg.attr("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);

})();