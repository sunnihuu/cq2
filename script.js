(function () {
  const svg = d3.select("#canvas");
  const g   = svg.append("g");

  // ========== 数据 ==========
  // 节点
  const nodes = [
    { id:"pizza", label:"PIZZA", sub:"Object of study", x:260, y:220, r:90, type:"core",
      tip:"Research object" },

    { id:"data", label:"DATA & ASSUMPTIONS", sub:"Origins · Distances · Emission factors", x:640, y:170, r:84, type:"hollow",
      tip:"Public datasets, proxies, standardized slice" },

    { id:"model", label:"COMPUTATION", sub:"LCA · GIS · Scenarios", x:640, y:410, r:110, type:"black",
      tip:"Carbon model combining LCA & GIS. Toggle Global/Local.",
      details:{
        title:"Computation — Carbon Model",
        subtitle:"LCA + GIS with scenario toggle (Global vs Local)",
        html: `
          <h3>Inputs</h3>
          <ul>
            <li>Ingredient amounts per slice (dough, cheese, sauce)</li>
            <li>Origins & routes (legs, mode, distance, load factor)</li>
            <li>Emission factors: production & transport</li>
          </ul>
          <h3>Core Equations</h3>
          <ul>
            <li>E_prod = Σ (amount × EF_stage)</li>
            <li>E_trans = Σ ((amount/1000) × distance_km × EF_mode ÷ load_factor)</li>
            <li>E_slice = Σ (E_prod + E_trans)</li>
          </ul>
          <h3>Scenarios</h3>
          <ul>
            <li>Global: dominant regions (e.g., Kansas, Wisconsin, California/Italy)</li>
            <li>Local: NY/NJ regional sourcing & shorter legs</li>
          </ul>
        `
      }
    },

    { id:"outputs", label:"DESIGN OUTPUTS", sub:"Interactive Map · Carbon Receipt · Menu · Installation", x:1010, y:210, r:118, type:"hollow",
      tip:"Visual & experiential artefacts for the public" },

    { id:"public", label:"PUBLIC ENGAGEMENT", sub:"Experiential dinner · Workshop · Polls", x:1340, y:360, r:100, type:"black",
      tip:"Where debate and feedback happen",
      details:{
        title:"Public Engagement",
        subtitle:"Experiential Dinner · Workshop · Polls / Comment Wall",
        html: `
          <h3>Why</h3>
          <ul>
            <li>Translate data into a shared, embodied experience</li>
            <li>Collect attitudes: comprehension, willingness to switch</li>
          </ul>
          <h3>How</h3>
          <ul>
            <li>Side-by-side tasting (Global vs Local)</li>
            <li>Voting wall & ingredient-swapping mini-simulator</li>
            <li>Receipts with QR ↔ Interactive Map</li>
          </ul>
        `
      }
    },

    // 子主题
    { id:"ing", label:"Ingredients", sub:"Wheat · Cheese · Tomato", x:450, y:120, r:58, type:"solid", tip:"Representative ingredients" },
    { id:"transport", label:"Transport", sub:"Truck · Rail · Ship", x:460, y:260, r:54, type:"solid", tip:"Modes and corridors" },

    { id:"lca", label:"LCA", sub:"Production · Processing", x:540, y:520, r:56, type:"solid",
      tip:"Life-cycle emissions for production/processing",
      details:{
        title:"LCA — Production & Processing",
        subtitle:"System boundary: farm gate → processing → distribution center",
        html: `
          <h3>Includes</h3>
          <ul>
            <li>Crop cultivation / milk production (inputs, energy, land-use where applicable)</li>
            <li>Milling, cheesemaking, tomato processing (electricity, heat, refrigerants)</li>
            <li>Upstream packaging when necessary</li>
          </ul>
          <h3>Key Parameters</h3>
          <ul>
            <li>EFs (kg CO₂e/kg): Poore & Nemecek, Agribalyse (proxies documented)</li>
            <li>Dairy allocation (mass vs economic) — stated in assumptions</li>
            <li>Standardized slice portions (dough/cheese/sauce)</li>
          </ul>
          <h3>Out of Scope</h3>
          <ul>
            <li>Kitchen energy, consumer travel, end-of-life</li>
          </ul>
        `
      }
    },

    { id:"gis", label:"GIS", sub:"Routes · Distance · Mode", x:740, y:520, r:56, type:"solid",
      tip:"Spatial legs: distance × mode × load factor",
      details:{
        title:"GIS — Routes, Distance & Mode",
        subtitle:"OD legs: origin → processing → NYC entry → pizzeria",
        html: `
          <h3>Includes</h3>
          <ul>
            <li>Great-circle or network distances (OSM / Google, BTS / FAF references)</li>
            <li>Mode-specific EF_mode (truck / rail / ship) with average load factors</li>
          </ul>
          <h3>Formula</h3>
          <ul>
            <li>E_trans = (amount/1000) × distance_km × EF_mode ÷ load_factor</li>
          </ul>
          <h3>Uncertainty</h3>
          <ul>
            <li>Supplier routes not public → representative corridors + proxies</li>
          </ul>
        `
      }
    },

    { id:"map", label:"Map", sub:"Flow thickness ≈ CO₂e", x:980, y:90, r:48, type:"solid", tip:"Interactive map (Leaflet/Mapbox)" },
    { id:"receipt", label:"Carbon Receipt", sub:"Per-slice & per-ingredient", x:1130, y:110, r:48, type:"solid", tip:"Printable ticket / QR" },
    { id:"menu", label:"Menu", sub:"CO₂e-labelled", x:1080, y:300, r:48, type:"solid", tip:"Speculative carbon menu" },
  ];

  // 连线（主流程 + 辅助 + 反馈）
  const links = [
    // 主流程
    {s:"pizza", t:"data", kind:"main"},
    {s:"data",  t:"model", kind:"main"},
    {s:"model", t:"outputs", kind:"main"},
    {s:"outputs", t:"public", kind:"main"},
    // 辅助
    {s:"pizza", t:"model", kind:"aux"},
    {s:"data",  t:"ing",   kind:"aux"},
    {s:"data",  t:"transport", kind:"aux"},
    {s:"model", t:"lca", kind:"aux"},
    {s:"model", t:"gis", kind:"aux"},
    {s:"outputs", t:"map", kind:"aux"},
    {s:"outputs", t:"receipt", kind:"aux"},
    {s:"outputs", t:"menu", kind:"aux"},
    // 反馈
    {s:"public", t:"data", kind:"dash"},
  ];

  // 分组虚线圈（可作为区域标题）
  const orbits = [
    { cx:260,  cy:220, r:160, title:"Object" },
    { cx:640,  cy:290, r:210, title:"Data + Model" },
    { cx:1010, cy:210, r:180, title:"Design Outputs" },
    { cx:1340, cy:360, r:165, title:"Public" },
  ];

  // ========== 绘制 ==========
  const idToNode = Object.fromEntries(nodes.map(n => [n.id, n]));
  const L = links.map(d => ({...d, s: idToNode[d.s], t: idToNode[d.t]}));

  function curved(a, b){
    const dx = b.x - a.x, dy = b.y - a.y;
    const mx = (a.x + b.x)/2, my = (a.y + b.y)/2;
    const curve = Math.sign(dy || 1) * Math.min(120, Math.hypot(dx,dy)*0.25);
    return `M ${a.x} ${a.y} Q ${mx} ${my - curve} ${b.x} ${b.y}`;
  }

  // 创建分层组 - 确保渲染顺序
  const linksGroup = g.append("g").attr("class", "links-layer");
  const orbitsGroup = g.append("g").attr("class", "orbits-layer");
  const nodesGroup = g.append("g").attr("class", "nodes-layer");

  // links - 最底层
  const link = linksGroup.selectAll(".link").data(L).enter().append("path")
    .attr("class", d => `link ${d.kind==='aux'?'aux':''} ${d.kind==='dash'?'dashed':''}`)
    .attr("d", d => curved(d.s, d.t));

  // orbits - 中间层
  orbitsGroup.selectAll(".orbit").data(orbits).enter().append("circle")
    .attr("class","orbit")
    .attr("cx", d=>d.cx).attr("cy", d=>d.cy).attr("r", d=>d.r);

  // nodes - 最上层
  const node = nodesGroup.selectAll(".node").data(nodes).enter().append("g")
    .attr("class", d => `node ${d.type||'solid'}`)
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .style("cursor","pointer");

  node.append("circle").attr("r", d=>d.r);

  node.append("text")
    .attr("class", d => (d.type==='core' || d.type==='black') ? "label inverse" : "label")
    .attr("y", -6)
    .text(d=>d.label);

  node.append("text")
    .attr("class","subtext")
    .attr("y", 14)
    .text(d=>d.sub || "");

  // tooltip
  const tip = d3.select("#tooltip");
  node.on("mousemove", (ev,d)=>{
      if(!d.tip){ tip.attr("hidden", true); return; }
      tip.text(d.tip).attr("hidden", false)
         .style("left", (ev.clientX + 10) + "px")
         .style("top",  (ev.clientY - 10) + "px");
    })
    .on("mouseout", ()=> tip.attr("hidden", true));

  // 高亮 & 细节面板
  const panel   = document.getElementById('details');
  const dTitle  = document.getElementById('dTitle');
  const dSub    = document.getElementById('dSubtitle');
  const dBody   = document.getElementById('dBody');
  const closeBtn= document.getElementById('closeDetails');
  closeBtn.addEventListener('click', ()=> panel.hidden = true);

  function highlightFrom(id){
    link.classed("highlighted", l => l.s.id === id);
  }
  function resetHighlight(){
    link.classed("highlighted", false);
  }
  function openDetails(d){
    if(!d.details){ panel.hidden = true; return; }
    dTitle.textContent = d.details.title || d.label;
    dSub.textContent   = d.details.subtitle || (d.sub || "");
    dBody.innerHTML    = d.details.html || "";
    panel.hidden = false;
  }

  node.on("click", (_,d)=>{ highlightFrom(d.id); openDetails(d); });
  svg.on("dblclick", ()=>{ resetHighlight(); panel.hidden = true; });

  // 场景切换（示例：仅切换描边颜色；你也可在此切换数据）
  const btnG = document.getElementById('btnGlobal');
  const btnL = document.getElementById('btnLocal');

  function setScenario(mode){
    const isGlobal = mode === 'global';
    btnG.classList.toggle('active', isGlobal);
    btnG.setAttribute('aria-pressed', isGlobal);
    btnL.classList.toggle('active', !isGlobal);
    btnL.setAttribute('aria-pressed', !isGlobal);

    // 用场景色强调主流程
    const accent = isGlobal ? 'var(--accent-global)' : 'var(--accent-local)';
    link.filter(d=>d.kind==='main').attr("stroke", accent);
  }

  btnG.addEventListener('click', ()=> setScenario('global'));
  btnL.addEventListener('click', ()=> setScenario('local'));
  setScenario('global'); // 默认

})();
