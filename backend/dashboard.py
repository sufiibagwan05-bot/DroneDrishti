import streamlit as st
import pandas as pd
import requests
import plotly.express as px

st.set_page_config(page_title="DroneDrishti HQ - AAR", layout="wide", page_icon="🛡️")

st.markdown("""
    <style>
    .main {background-color: #0b0f19;}
    h1, h2, h3, h4 {color: #00ffcc;}
    .stMetric {background-color: #121a2b; padding: 15px; border-radius: 6px; border: 1px solid #00ffcc;}
    </style>
""", unsafe_allow_html=True)

st.title("🛡️ DroneDrishti: Military After-Action Review (AAR)")
st.caption("Command-Level Readiness & Skill-Gap Analytics Platform")

API_URL = "https://dronedrishti-backend.onrender.com/api/results"

def get_data():
    try:
        res = requests.get(API_URL)
        if res.status_code == 200:
            return res.json()
    except:
        return []
    return []

raw_data = get_data()

# Sidebar Filters
st.sidebar.header("🎯 Unit & Trainee Filters")
if len(raw_data) > 0:
    df_all = pd.DataFrame(raw_data)
    
    # Yahan add krni hai ye line:
    df_all['timestamp'] = pd.to_datetime(df_all['timestamp']).dt.tz_localize('UTC').dt.tz_convert('Asia/Kolkata')
    
    units = ["All Units"] + sorted(list(df_all['unit_id'].dropna().unique()))
    selected_unit = st.sidebar.selectbox("Filter by Unit", units)
    
    if selected_unit != "All Units":
        df = df_all[df_all['unit_id'] == selected_unit]
    else:
        df = df_all
else:
    df = pd.DataFrame()

if st.sidebar.button("🔄 Sync Live Telemetry"):
    st.rerun()

if not df.empty:
    # Key Performance Indicators
    st.subheader(f"📊 Unit Performance: {selected_unit}")
    col1, col2, col3, col4 = st.columns(4)

    avg_score = df['score'].mean()
    avg_reaction = df['reaction_time_ms'].mean() / 1000
    accuracy = (len(df[df['score'] >= 80]) / len(df)) * 100
    critical_errors = len(df[df['score'] < 50])

    col1.metric("Combat Readiness Score", f"{avg_score:.1f} / 100")
    col2.metric("Mean Time-to-Detect (TTD)", f"{avg_reaction:.2f} s")
    col3.metric("Engagement Accuracy", f"{accuracy:.1f} %")
    col4.metric("Tactical Breaches", critical_errors)

    st.markdown("---")

    # Visual Analytics
    colA, colB = st.columns(2)
    with colA:
        st.subheader("Skill Degradation by Environment")
        env_chart = df.groupby('scenario')['score'].mean().reset_index()
        fig_env = px.bar(env_chart, x='scenario', y='score', color='scenario', title="Avg Score under EW / Day / Night Stress")
        fig_env.update_layout(plot_bgcolor='#0b0f19', paper_bgcolor='#0b0f19', font_color='white')
        st.plotly_chart(fig_env, use_container_width=True)

    with colB:
        st.subheader("Reaction Latency vs Combat Accuracy")
        fig_scatter = px.scatter(df, x='reaction_time_ms', y='score', color='difficulty', hover_data=['trainee_id', 'weapon_used'], title="Reaction Speed vs Score")
        fig_scatter.update_layout(plot_bgcolor='#0b0f19', paper_bgcolor='#0b0f19', font_color='white')
        st.plotly_chart(fig_scatter, use_container_width=True)

    # Detailed Logs & Export
    st.subheader("📋 Trainee Performance Ledger")
    st.dataframe(df[['trainee_id', 'unit_id', 'difficulty', 'scenario', 'weapon_used', 'score', 'feedback', 'timestamp']], use_container_width=True)

    # CSV Download Button
    csv = df.to_csv(index=False).encode('utf-8')
    st.download_button("📥 Export Official AAR Report (CSV)", csv, "DroneDrishti_AAR_Report.csv", "text/csv")

else:
    st.warning("📡 No simulation sessions recorded in SQLite Database. Complete a deployment in the simulator first.")