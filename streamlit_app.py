import streamlit as st
import numpy as np
import plotly.graph_objects as go
import plotly.subplots as sp
import pandas as pd

# Streamlit app configuration
st.set_page_config(page_title="音のデジタル表現", layout="wide")

# Title and credits
st.title("🎵 音のデジタル表現")
st.caption("Created by Dit-Lab.(Daiki ITO)")
st.caption("Supported by Tomoaki ATSUMI")

# Introduction
st.markdown("""
このアプリケーションでは、音がどのようにデジタル化されるかを体験的に学ぶことができます。
下のスライダーを動かして、**サンプリング周波数**と**量子化ビット数**を変更し、音のデジタル化プロセスを観察しましょう。
""")

# Parameter settings
st.header("📊 パラメータ設定")

col1, col2 = st.columns(2)

with col1:
    sampling_freq = st.slider(
        "サンプリング周波数 (Hz)",
        min_value=8,
        max_value=200,
        value=44,
        step=4,
        help="1秒間に音の波形を何回計測するかを設定します"
    )

with col2:
    quantization_bits = st.slider(
        "量子化ビット数 (bit)",
        min_value=1,
        max_value=8,
        value=4,
        step=1,
        help="音の大きさを何段階で表現するかを設定します"
    )

# Generate analog waveform (example: sine wave with noise)
time_duration = 1.0  # 1 second
analog_sample_rate = 1000  # High resolution for smooth analog representation
t_analog = np.linspace(0, time_duration, int(analog_sample_rate * time_duration))

# Create a complex waveform (combination of frequencies)
frequency1 = 5  # Hz
frequency2 = 12  # Hz
analog_signal = (np.sin(2 * np.pi * frequency1 * t_analog) + 
                0.5 * np.sin(2 * np.pi * frequency2 * t_analog) + 
                0.2 * np.sin(2 * np.pi * frequency1 * 3 * t_analog))

# Add some noise to make it more realistic
np.random.seed(42)  # For reproducible results
analog_signal += 0.1 * np.random.normal(0, 1, len(analog_signal))

# Normalize to -1 to 1 range
analog_signal = analog_signal / np.max(np.abs(analog_signal))

# Digital processing
# Step 1: Sampling
sample_interval = 1.0 / sampling_freq
t_sampled = np.arange(0, time_duration, sample_interval)
sampled_signal = np.interp(t_sampled, t_analog, analog_signal)

# Step 2: Quantization
quantization_levels = 2 ** quantization_bits
max_amplitude = 1.0
quantization_step = (2 * max_amplitude) / quantization_levels
quantized_signal = np.round(sampled_signal / quantization_step) * quantization_step

# Step 3: Encoding (binary representation)
quantized_integers = ((quantized_signal + max_amplitude) / quantization_step).astype(int)
quantized_integers = np.clip(quantized_integers, 0, quantization_levels - 1)

# Visualization
st.header("🔍 デジタル化プロセスの可視化")

# Step 1: Analog waveform and sampling
st.subheader("ステップ1: アナログ波形とサンプリング（標本化）")

fig1 = go.Figure()

# Plot analog waveform
fig1.add_trace(go.Scatter(
    x=t_analog,
    y=analog_signal,
    mode='lines',
    name='アナログ波形',
    line=dict(color='blue', width=2)
))

# Plot sampled points
fig1.add_trace(go.Scatter(
    x=t_sampled,
    y=sampled_signal,
    mode='markers',
    name=f'サンプリング点 ({sampling_freq} Hz)',
    marker=dict(color='red', size=8)
))

# Draw vertical lines from x-axis to sampled points
for i, (t, s) in enumerate(zip(t_sampled, sampled_signal)):
    fig1.add_trace(go.Scatter(
        x=[t, t],
        y=[0, s],
        mode='lines',
        line=dict(color='red', width=1, dash='dash'),
        showlegend=False,
        hoverinfo='skip'
    ))

fig1.update_layout(
    title=f'サンプリング周波数: {sampling_freq} Hz',
    xaxis_title='時間 (秒)',
    yaxis_title='振幅',
    xaxis=dict(range=[0, 1]),
    yaxis=dict(range=[-1.2, 1.2]),
    showlegend=True,
    width=900,
    height=400
)

st.plotly_chart(fig1, use_container_width=True)

st.markdown(f"""
**サンプリングの説明:**
- アナログ波形（青線）から、{sampling_freq} Hz の間隔で値を取得（赤点）
- サンプリング周波数が高いほど、より多くの点でデータを取得し、元の波形を忠実に再現できます
""")

# Step 2: Quantization
st.subheader("ステップ2: 量子化")

fig2 = go.Figure()

# Create quantization levels
quantization_line_levels = np.linspace(-max_amplitude, max_amplitude, quantization_levels + 1)

# Plot quantization levels as horizontal lines
for level in quantization_line_levels:
    fig2.add_hline(y=level, line_color='gray', line_width=1, opacity=0.3)

# Plot sampled signal
fig2.add_trace(go.Scatter(
    x=t_sampled,
    y=sampled_signal,
    mode='markers',
    name='サンプリング値',
    marker=dict(color='red', size=8, opacity=0.7)
))

# Plot quantized signal
fig2.add_trace(go.Scatter(
    x=t_sampled,
    y=quantized_signal,
    mode='markers',
    name='量子化値',
    marker=dict(color='green', size=10, symbol='square', opacity=0.8)
))

# Draw lines showing quantization mapping
for i, (t, original, quantized) in enumerate(zip(t_sampled, sampled_signal, quantized_signal)):
    fig2.add_trace(go.Scatter(
        x=[t, t],
        y=[original, quantized],
        mode='lines',
        line=dict(color='black', width=1, dash='dash'),
        showlegend=False,
        hoverinfo='skip'
    ))

# Add quantization level labels
for i, level in enumerate(quantization_line_levels[:-1]):
    mid_level = (quantization_line_levels[i] + quantization_line_levels[i+1]) / 2
    fig2.add_annotation(
        x=0.02,
        y=mid_level,
        text=f'レベル{i}',
        showarrow=False,
        font=dict(size=10),
        opacity=0.7
    )

fig2.update_layout(
    title=f'量子化ビット数: {quantization_bits} bit ({quantization_levels} 段階)',
    xaxis_title='時間 (秒)',
    yaxis_title='振幅',
    xaxis=dict(range=[0, 1]),
    yaxis=dict(range=[-1.2, 1.2]),
    showlegend=True,
    width=900,
    height=400
)

st.plotly_chart(fig2, use_container_width=True)

st.markdown(f"""
**量子化の説明:**
- サンプリングされた値（赤丸）を、{quantization_levels} 段階のレベル（緑四角）に丸めます
- ビット数が多いほど段階が細かくなり、より正確な値を表現できます
- 現在の設定では {quantization_step:.3f} の間隔で量子化されています
""")

# Step 3: Binary encoding
st.subheader("ステップ3: 符号化（2進数表現）")

# Show first few samples as binary using DataFrame
st.markdown("**最初の数サンプルの2進数表現:**")

# Show first 8 samples or all if less than 8
num_samples_to_show = min(8, len(t_sampled))

# Create DataFrame
binary_data = []
for i in range(num_samples_to_show):
    binary_repr = format(quantized_integers[i], f'0{quantization_bits}b')
    binary_data.append({
        '時間 (秒)': f"{t_sampled[i]:.3f}",
        '量子化レベル': quantized_integers[i],
        '2進数表現': binary_repr
    })

df_binary = pd.DataFrame(binary_data)
st.dataframe(df_binary, use_container_width=True, hide_index=True)

# Final comparison visualization
st.subheader("比較: アナログ vs デジタル")

# Create subplot figure
fig3 = sp.make_subplots(
    rows=2, cols=1,
    subplot_titles=['アナログ信号', f'デジタル信号 ({sampling_freq} Hz, {quantization_bits} bit)'],
    vertical_spacing=0.1
)

# Original analog signal
fig3.add_trace(
    go.Scatter(
        x=t_analog,
        y=analog_signal,
        mode='lines',
        name='元のアナログ信号',
        line=dict(color='blue', width=2)
    ),
    row=1, col=1
)

# Digital reconstruction (step function)
digital_time = []
digital_values = []
for i in range(len(t_sampled)):
    if i < len(t_sampled) - 1:
        digital_time.extend([t_sampled[i], t_sampled[i+1]])
        digital_values.extend([quantized_signal[i], quantized_signal[i]])
    else:
        digital_time.append(t_sampled[i])
        digital_values.append(quantized_signal[i])

fig3.add_trace(
    go.Scatter(
        x=digital_time,
        y=digital_values,
        mode='lines',
        name='デジタル復元信号',
        line=dict(color='red', width=2, shape='hv')
    ),
    row=2, col=1
)

fig3.add_trace(
    go.Scatter(
        x=t_sampled,
        y=quantized_signal,
        mode='markers',
        name='サンプル点',
        marker=dict(color='red', size=4, opacity=0.7)
    ),
    row=2, col=1
)

fig3.update_xaxes(title_text='時間 (秒)', range=[0, 1], row=2, col=1)
fig3.update_yaxes(title_text='振幅', range=[-1.2, 1.2])
fig3.update_layout(
    height=600,
    showlegend=True
)

st.plotly_chart(fig3, use_container_width=True)

# Summary and insights
st.header("📝 まとめと考察")

col1, col2 = st.columns(2)

with col1:
    st.subheader("🔊 サンプリング周波数の影響")
    st.markdown(f"""
    **現在の設定: {sampling_freq} Hz**
    
    - **低い周波数 (< 20 Hz)**: 音がぼやけて聞こえる
    - **適度な周波数 (20-100 Hz)**: バランスの良い音質
    - **高い周波数 (> 100 Hz)**: よりクリアで元の音に近い
    
    現在は **{len(t_sampled)} 個**のサンプル点でデータを記録しています。
    """)

with col2:
    st.subheader("🎚️ 量子化ビット数の影響")
    st.markdown(f"""
    **現在の設定: {quantization_bits} bit ({quantization_levels} 段階)**
    
    - **少ないビット数 (1-2 bit)**: 音がギザギザになりノイズが増加
    - **適度なビット数 (3-5 bit)**: 基本的な音質を保持
    - **多いビット数 (6-8 bit)**: より滑らかで豊かな音
    
    現在の量子化ステップ: **{quantization_step:.3f}**
    """)

st.subheader("🎯 重要なポイント")
st.markdown("""
1. **サンプリング周波数**は時間軸の解像度を決定します
2. **量子化ビット数**は振幅軸の解像度を決定します
3. この2つの要素が組み合わさって、デジタル音声の品質が決まります
4. 高品質にするほど、より多くのデータ容量が必要になります

**実験してみよう！**
上のスライダーを動かして、異なる設定での音のデジタル化を観察してください。
""")

# Additional educational content
with st.expander("🔬 より詳しい技術情報"):
    st.markdown(f"""
    ### 現在の設定による詳細情報
    
    **データ量の計算:**
    - サンプル数: {len(t_sampled)} 個
    - 1サンプルあたりのビット数: {quantization_bits} bit
    - 総データ量: {len(t_sampled) * quantization_bits} bit = {(len(t_sampled) * quantization_bits) / 8:.1f} バイト
    
    **ナイキスト周波数:**
    - サンプリング周波数の半分: {sampling_freq / 2:.1f} Hz
    - これより高い周波数の音は正確に再現できません
    
    **量子化誤差:**
    - 最大誤差: ±{quantization_step/2:.3f}
    - 信号対量子化ノイズ比 (SQNR): 約 {6.02 * quantization_bits:.1f} dB
    """)

# Interactive learning questions
st.subheader("💡 理解度チェック")

q1 = st.radio(
    "サンプリング周波数を上げると何が起こりますか？",
    ["音が大きくなる", "時間軸の解像度が上がる", "音が小さくなる", "何も変わらない"]
)

if q1 == "時間軸の解像度が上がる":
    st.success("正解！サンプリング周波数を上げると、より細かい時間間隔で音を記録できます。")
else:
    st.error("不正解です。サンプリング周波数は時間軸の解像度に関係します。")

q2 = st.radio(
    "量子化ビット数を増やすとどうなりますか？",
    ["サンプル数が増える", "音の大きさの表現が細かくなる", "処理速度が上がる", "ファイルサイズが小さくなる"]
)

if q2 == "音の大きさの表現が細かくなる":
    st.success("正解！ビット数を増やすと、音の振幅をより細かく表現できます。")
else:
    st.error("不正解です。量子化ビット数は音の振幅の表現精度に関係します。")