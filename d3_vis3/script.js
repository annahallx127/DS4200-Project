const width = 1100;   
const height = 700;

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

// csv
d3.dsv(";", "student.csv").then(data => {

  data.forEach(d => {
    d.Debtor = d["Debtor"].trim() === "1" ? "Has Debt" : "No Debt";
    d.TuitionStatus = d["Tuition fees up to date"].trim() === "1"
      ? "Tuition Up to Date"
      : "Tuition Not Up to Date";
    d.ScholarshipHolder = d["Scholarship holder"].trim() === "1"
      ? "Holds Scholarship"
      : "No Scholarship";
    d.Target = d["Target"].trim();
  });

// hierarchy
  const nestedData = d3.rollup(
    data,
    v => v.length,
    d => d.Debtor,
    d => d.TuitionStatus,
    d => d.ScholarshipHolder,
    d => d.Target
  );

  function mapToHierarchy(map, name = "Students") {
    const children = [];
    for (const [key, value] of map) {
      if (value instanceof Map) {
        children.push(mapToHierarchy(value, key));
      } else {
        children.push({ name: key, value: value });
      }
    }
    return { name, children };
  }

  const rootData = mapToHierarchy(nestedData);

  const root = d3.hierarchy(rootData)
    .sum(d => d.value)
    .sort((a, b) => b.value - a.value);

  //treemap 
  d3.treemap()
    .size([width - 300, height]) 
    .paddingInner(2)
    .paddingOuter(4)
    .round(true)(root);

// colors
  const colorDebtor = d3.scaleOrdinal()
    .domain(["Has Debt", "No Debt"])
    .range(["#ff6f61", "#6b5b95"]);

  const colorTuition = d3.scaleOrdinal()
    .domain(["Tuition Up to Date", "Tuition Not Up to Date"])
    .range(["#88b04b", "#7f8c8d"]);

  const colorScholarship = d3.scaleOrdinal()
    .domain(["Holds Scholarship", "No Scholarship"])
    .range(["#92a8d1", "#955251"]);

  const colorOutcome = d3.scaleOrdinal()
    .domain(["Graduate", "Dropout", "Enrolled"])
    .range(["#2ca02c", "#d62728", "#ff7f0e"]);

  function getColor(d) {
    if (d.depth === 1) return colorDebtor(d.data.name);
    if (d.depth === 2) return colorTuition(d.data.name);
    if (d.depth === 3) return colorScholarship(d.data.name);
    if (d.depth === 4) return colorOutcome(d.data.name);
    return "#ccc";
  }

  const nodes = svg.selectAll("g.node")
    .data(root.descendants())
    .join("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x0},${d.y0})`);

  nodes.append("rect")
    .attr("width", d => Math.max(0, d.x1 - d.x0))
    .attr("height", d => Math.max(0, d.y1 - d.y0))
    .attr("fill", d => getColor(d))
    .attr("stroke", "#fff")
    .style("opacity", d => d.children ? 0.55 : 1)
    .on("mousemove", (event, d) => {
      const sequence = d.ancestors().reverse().map(a => a.data.name).slice(1);
      const percent = ((d.value / root.value) * 100).toFixed(1);

      tooltip.style("opacity", 1)
        .html(`
          <strong>${sequence.join(" → ")}</strong><br/>
          Count: ${d.value} (${percent}%)
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));

// labels
nodes.filter(d => !d.children) 
  .append("text")
  .attr("x", 4)
  .attr("y", 14)
  .text(d => d.data.name)
  .attr("fill", "#000")
  .style("font-size", "11px")
  .style("pointer-events", "none")
  .each(function(d) {
    const node = d3.select(this);
    const width = d.x1 - d.x0;
    if (this.getComputedTextLength() > width - 8) {
      node.text("");
    }
  });


  // legend
  const legendData = [
   // { category: "Debtor", name: "Has Debt", color: "#ff6f61" },
   // { category: "Debtor", name: "No Debt", color: "#6b5b95" },
   // { category: "Tuition", name: "Up to Date", color: "#88b04b" },
   // { category: "Tuition", name: "Not Up to Date", color: "#7f8c8d" },
   // { category: "Scholarship", name: "Holds Scholarship", color: "#92a8d1" },
   // { category: "Scholarship", name: "No Scholarship", color: "#955251" },
    { category: "Outcome", name: "Graduate", color: "#2ca02c" },
    { category: "Outcome", name: "Dropout", color: "#d62728" },
    { category: "Outcome", name: "Enrolled", color: "#ff7f0e" }
  ];

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width - 250}, 40)`);  // <— fixed position

  let yOffset = 0;
  let lastCategory = "";

  legendData.forEach(d => {
    if (d.category !== lastCategory) {
      if (lastCategory !== "") yOffset += 10;
      legend.append("text")
        .attr("x", 0)
        .attr("y", yOffset)
        .text(d.category)
        .style("font-weight", "bold")
        .style("font-size", "14px");
      yOffset += 20;
      lastCategory = d.category;
    }

    legend.append("rect")
      .attr("x", 0)
      .attr("y", yOffset)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d.color);

    legend.append("text")
      .attr("x", 22)
      .attr("y", yOffset + 12)
      .text(d.name)
      .style("font-size", "13px");

    yOffset += 22;
  });

});
