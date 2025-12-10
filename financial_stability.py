import pandas as pd
import altair as alt

# Read the data
df = pd.read_csv('data/cleaned_students.csv')

# Define the financial factors
financial_factors = ['Debtor', 'Scholarship holder', 'Tuition fees up to date']

# Prepare data for visualization
plot_data = []

for factor in financial_factors:
    for status in ['No', 'Yes']:
        subset = df[df[factor] == status]
        total = len(subset)
        
        if total > 0:
            for outcome in ['Graduate', 'Enrolled', 'Dropout']:
                count = len(subset[subset['Target'] == outcome])
                percentage = (count / total) * 100
                plot_data.append({
                    'Factor': factor,
                    'Status': status,
                    'Outcome': outcome,
                    'Percentage': percentage
                })

plot_df = pd.DataFrame(plot_data)

# Color scheme
color_scale = alt.Scale(
    domain=['Graduate', 'Enrolled', 'Dropout'],
    range=["#2ca02c","#ff7f0e", "#d62728"]
)

# Base chart 
base = (
    alt.Chart(plot_df)
    .mark_bar()
    .encode(
        x=alt.X('Status:N',
                title='Status (Yes / No)',
                axis=alt.Axis(
                    labelFont='Georgia, Times New Roman, serif',
                    titleFont='Georgia, Times New Roman, serif',
                    labelFontSize=11,
                    titleFontSize=11
                )),
        y=alt.Y('Percentage:Q',
                title='Percentage of Students (%)',
                scale=alt.Scale(domain=[0, 100]),
                axis=alt.Axis(
                    labelFont='Georgia, Times New Roman, serif',
                    titleFont='Georgia, Times New Roman, serif',
                    labelFontSize=10,
                    titleFontSize=11,
                    grid=True,
                    gridOpacity=0.3,
                    gridDash=[3, 3]
                )),
        color=alt.Color('Outcome:N',
                        scale=color_scale,
                        legend=alt.Legend(
                            title='Outcome',
                            titleFont='Georgia, Times New Roman, serif',
                            labelFont='Georgia, Times New Roman, serif',
                            titleFontSize=12,
                            labelFontSize=11,
                            orient='right',
                            fillColor='white',
                            strokeColor='gray',
                            padding=10,
                            cornerRadius=5
                        )),
        tooltip=[
            alt.Tooltip('Factor:N', title='Financial Factor'),
            alt.Tooltip('Status:N', title='Status'),
            alt.Tooltip('Outcome:N', title='Outcome'),
            alt.Tooltip('Percentage:Q', title='Percentage', format='.2f')
        ]
    )
)

# Faceted layout
facet_chart = (
    base.properties(width=180, height=350)
    .facet(
        column=alt.Column(
            'Factor:N',
            title=None,
            header=alt.Header(
                labelFont='Georgia, Times New Roman, serif',
                labelFontSize=13,
                labelFontWeight='bold',
                labelPadding=15
            )
        )
    )
)

# Add title
final_chart = (
    facet_chart
    .properties(
        title=alt.TitleParams(
            "Percentage of Student Outcomes by Financial Stability Factors",
            font="Georgia, Times New Roman, serif",
            fontSize=18,
            anchor="start",      
            color="#333333"
        )
    )
    .configure_view(
        strokeWidth=0,
        fill='white'
    )
    .configure(background='white')
)

# Save
final_chart.save("viz2_altair.html")

print("Chart saved successfully!")