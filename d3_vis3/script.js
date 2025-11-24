const width = 850;   
const height = 700;
const radius = Math.min(width - 200, height) / 2; 

const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${radius + 180},${height / 2})`);

const tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip");

d3.dsv(";", "student.csv").then(data => {

  data.forEach(d => {
    d.Debtor = d["Debtor"].trim() === "1" ? "Has Debt" : "No Debt";
    d.TuitionStatus = d["Tuition fees up to date"].trim() === "1" ? "Tuition Up to Date" : "Tuition Not Up to Date";
    d.ScholarshipHolder = d["Scholarship holder"].trim() === "1" ? "Holds Scholarship" : "No Scholarship";
    d.Target = d["Target"].trim();
  });

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
    return { name: name, children: children };
  }

  const rootData = mapToHierarchy(nestedData);
  const root = d3.hierarchy(rootData).sum(d => d.value);
  d3.partition().size([2 * Math.PI, radius])(root);

  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1);


  // color scales
  const colorDebtor = d3.scaleOrdinal()
    .domain(["Has Debt", "No Debt"])
    .range(["#ff6f61", "#6b5b95"]);

  const colorTuition = d3.scaleOrdinal()
    .domain(["Tuition: Up to Date", "Tuition: Not Up to Date"])
    .range(["#88b04b", "#f7cac9"]);

  const colorScholarship = d3.scaleOrdinal()
    .domain(["Scholarship: Yes", "Scholarship: No"])
    .range(["#92a8d1", "#955251"]);

  const colorOutcome = d3.scaleOrdinal()
    .domain(["Outcome: Graduate", "Outcome: Dropout", "Outcome: Enrolled"])
    .range(["#034f84", "#d65076", "#ffb347"]);

  function getColor(d) {
    if (!d.depth) return "#ccc";
    if (d.depth === 1) return colorDebtor(d.data.name);
    if (d.depth === 2) return colorTuition(d.data.name);
    if (d.depth === 3) return colorScholarship(d.data.name);
    if (d.depth === 4) return colorOutcome(d.data.name);
    return "#ccc";
  }

  // arcs
  const paths = svg.selectAll("path")
    .data(root.descendants())
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", getColor)
    .attr("stroke", "#fff")
    .style("opacity", 1);

  //highlight on hover
  function highlight(d) {
    const sequence = d.ancestors();
    paths.style("opacity", node => sequence.includes(node) ? 1 : 0.3);
  }

  function resetHighlight() {
    paths.style("opacity", 1);
  }

  //tooltip w colored circles
  paths.on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);

      const sequence = d.ancestors().reverse().map(d => d.data.name).slice(1);
      const colors = d.ancestors().reverse().map(getColor).slice(1);
      const percent = ((d.value / root.value) * 100).toFixed(1);

      let html = "";
      sequence.forEach((name, i) => {
        html += `<span class="tooltip-circle" style="background-color:${colors[i]};"></span>${name}<br>`;
      });
      html += `<strong>Count:</strong> ${d.value} (${percent}%)`;

      tooltip.html(html)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");

      highlight(d);
    })
    .on("mousemove", event => {
      tooltip.style("left", (event.pageX + 10) + "px")
             .style("top", (event.pageY + 10) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition().duration(200).style("opacity", 0);
      resetHighlight();
    });

  // label centered
  svg.append("text")
    .attr("text-anchor", "middle")
    .attr("dy", "0.35em")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("font-family", "Arial, sans-serif")
    .text("Students");

  const legendData = [
    { category: "Debtor", name: "Has Debt", color: "#ff6f61" },
    { category: "Debtor", name: "No Debt", color: "#6b5b95" },
    { category: "Tuition", name: "Up to Date", color: "#88b04b" },
    { category: "Tuition", name: "Not Up to Date", color: "#f7cac9" },
    { category: "Scholarship", name: "Yes", color: "#92a8d1" },
    { category: "Scholarship", name: "No", color: "#955251" },
    { category: "Outcome", name: "Graduate", color: "#034f84" },
    { category: "Outcome", name: "Dropout", color: "#d65076" },
    { category: "Outcome", name: "Enrolled", color: "#ffb347" }
  ];

const legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${-radius - 160}, ${-height / 2 + 20})`);


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
        .style("font-family", "Arial, sans-serif")
        .style("font-size", "14px");
      yOffset += 20;
      lastCategory = d.category;
    }
    legend.append("rect")
      .attr("x", 10)
      .attr("y", yOffset)
      .attr("width", 15)
      .attr("height", 15)
      .attr("fill", d.color);

    legend.append("text")
      .attr("x", 30)
      .attr("y", yOffset + 12)
      .text(d.name)
      .style("font-family", "Arial, sans-serif")
      .style("font-size", "14px");

    yOffset += 25;
  });

});
