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

# Create DataFrame from the prepared data
plot_df = pd.DataFrame(plot_data)

# Define color scheme
color_scale = alt.Scale(
    domain=['Graduate', 'Enrolled', 'Dropout'],
    range=['#4CAF50', '#2196F3', '#F44336']
)

# Create the chart
chart = alt.Chart(plot_df).mark_bar().encode(
    x=alt.X('Status:N', 
            title='Status (Yes / No)',
            axis=alt.Axis(
                labelFontSize=11,
                titleFontSize=11,
                labelFont='Georgia, Times New Roman, serif',
                titleFont='Georgia, Times New Roman, serif'
            )),
    y=alt.Y('Percentage:Q', 
            title='Percentage of Students (%)',
            scale=alt.Scale(domain=[0, 100]),
            axis=alt.Axis(
                labelFontSize=10,
                titleFontSize=11,
                labelFont='Georgia, Times New Roman, serif',
                titleFont='Georgia, Times New Roman, serif',
                grid=True,
                gridOpacity=0.3,
                gridDash=[3, 3]
            )),
    color=alt.Color('Outcome:N', 
                    scale=color_scale,
                    legend=alt.Legend(
                        title='Outcome',
                        titleFontSize=12,
                        labelFontSize=11,
                        titleFont='Georgia, Times New Roman, serif',
                        labelFont='Georgia, Times New Roman, serif',
                        orient='right',
                        fillColor='white',
                        strokeColor='gray',
                        padding=10,
                        cornerRadius=5
                    )),
    order=alt.Order('Outcome:N', sort='ascending'),
    tooltip=[
        alt.Tooltip('Factor:N', title='Financial Factor'),
        alt.Tooltip('Status:N', title='Status'),
        alt.Tooltip('Outcome:N', title='Outcome'),
        alt.Tooltip('Percentage:Q', title='Percentage', format='.2f')
    ]
).properties(
    width=180,
    height=350
).facet(
    column=alt.Column('Factor:N',
                     title=None,
                     header=alt.Header(
                         labelFontSize=13,
                         labelFont='Georgia, Times New Roman, serif',
                         labelFontWeight='bold',
                         labelPadding=15
                     ))
).configure_view(
    strokeWidth=0,
    fill='white'
).configure(
    background='white'
).configure_axis(
    domainColor='#333',
    tickColor='#333'
)

# Save the chart
chart.save('viz2_altair.html')

print("Chart saved successfully!")
print(f"HTML: viz2_altair.html")
print("\nData Summary:")
print(f"Total students: {len(df)}")
print(f"\nOutcome distribution:")
print(df['Target'].value_counts())
