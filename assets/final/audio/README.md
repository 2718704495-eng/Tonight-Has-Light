# 《今夜有灯》第一夜环境音乐候选

`night-room-loop.ogg` 是一条 24 秒、可循环、无鼓点的轻量环境音乐候选。它只由 FFmpeg 的数学振荡器和固定种子的噪声源合成，没有采样、第三方音频、现成旋律或艺术家风格输入。

> 状态：工程候选。已完成文件、响度和循环边界的机器验证；尚未通过耳机、微信真机或目标用户听感验收。

## 声音设计

- 音高层：55 / 110 / 165 / 220 / 330 Hz 五层低频与柔和泛音，全部是 24 秒周期的整数倍，因此每轮的相位能回到同一位置。
- 呼吸感：各层仅以 6 / 8 / 12 / 24 秒的慢周期做小幅度起伏，没有节拍、鼓点或突然起音。
- 空间感：左右声道使用轻微不同的泛音比例，不做明显横向移动，避免疲惫状态下的注意力拉扯。
- 室内底色：固定种子 `20260821` 的极低电平棕噪声，经 45 Hz 高通、850 Hz 低通，并在首尾各 2.5 秒退到零，降低循环接缝风险。
- 编码：Ogg Vorbis、48 kHz、立体声、目标 48 kb/s；实际文件约 104.2 KiB。

## 可重复生成

以下命令在 FFmpeg `8.1.2`（Apple Silicon）上连续执行两次可得到完全相同的 OGG 字节。`+bitexact` 用于固定 Ogg 容器序列号等非声音字段；跨 FFmpeg 版本仍应以解码 PCM 一致性为准。

```sh
ffmpeg \
  -hide_banner -loglevel error -y -fflags +bitexact \
  -f lavfi \
  -i "aevalsrc=exprs='0.032*(0.82+0.18*cos(2*PI*t/24))*cos(2*PI*55*t)+0.026*(0.75+0.25*cos(2*PI*t/12+0.8))*cos(2*PI*110*t)+0.013*(0.74+0.26*cos(2*PI*t/8+2.1))*cos(2*PI*165*t)+0.008*(0.7+0.3*cos(2*PI*t/24+1.5))*cos(2*PI*220*t)+0.0035*(0.8+0.2*cos(2*PI*t/6))*cos(2*PI*330*t)|0.032*(0.82+0.18*cos(2*PI*t/24))*cos(2*PI*55*t)+0.023*(0.75+0.25*cos(2*PI*t/12+0.8))*cos(2*PI*110*t)+0.015*(0.74+0.26*cos(2*PI*t/8+2.1))*cos(2*PI*165*t)+0.006*(0.7+0.3*cos(2*PI*t/24+1.5))*cos(2*PI*220*t)+0.0042*(0.8+0.2*cos(2*PI*t/6))*cos(2*PI*330*t)':s=48000:d=24:c=stereo" \
  -fflags +bitexact \
  -f lavfi \
  -i "anoisesrc=r=48000:a=0.012:d=24:c=brown:seed=20260821" \
  -filter_complex "[1:a]highpass=f=45,lowpass=f=850,afade=t=in:st=0:d=2.5,afade=t=out:st=21.5:d=2.5,volume=0.16,pan=stereo|c0=c0|c1=c0[room];[0:a][room]amix=inputs=2:duration=first:normalize=0,volume=1.15,aresample=48000[out]" \
  -map "[out]" \
  -c:a vorbis -strict experimental -flags:a +bitexact -fflags +bitexact \
  -b:a 48k -ar 48000 -ac 2 \
  assets/final/audio/night-room-loop.ogg

cp assets/final/audio/night-room-loop.ogg \
  cocos-project/assets/resources/audio/night-room-loop.ogg
```

## 工程使用建议

- 只在用户首次触碰后启动播放；播放器音量从 0 在 2.5 秒内平滑升至产品目标音量。
- 启用循环播放，不在每轮重新执行渐入。
- 进入后台时暂停并记录播放位置；恢复时用短渐入回到原音量，避免系统切换造成突发声音。
- 静音与关闭声音时不影响任何剧情信息。
- 最终音量必须在微信真机、手机外放和耳机三种场景复核；本文件不替代听感验收。

## 机器验证（2026-08-21）

| 项目 | 结果 |
| --- | --- |
| SHA-256 | `d2b5df60c879dd9b3c4be65132b17605820d312259dff2e98fcdc47ea7b14b30` |
| 时长 | 24.000000 秒 |
| 编码 | Vorbis in Ogg |
| 采样率 / 声道 | 48,000 Hz / stereo |
| 文件大小 | 106,739 bytes（约 104.2 KiB） |
| 容器平均码率 | 35,579 bit/s |
| 综合响度 | -30.54 LUFS-I |
| 真峰值 | -20.71 dBTP |
| 响度范围 | 2.90 LU |
| `volumedetect` 平均 / 最大 | -30.9 / -20.7 dBFS |
| 解码帧数 | 1,152,000（正好 24 秒） |
| 首尾采样绝对差（L / R） | 0.003625 / 0.002164（-48.81 / -53.29 dBFS） |
| 相对边缘正常最大采样变化 | 首尾差分别低 15.85 / 20.18 dB |
| 两份工程文件 | SHA-256 完全一致 |

基础检查命令：

```sh
ffprobe -v error \
  -show_entries format=duration,size,bit_rate:stream=codec_name,sample_rate,channels,channel_layout \
  -of default=noprint_wrappers=1 \
  assets/final/audio/night-room-loop.ogg

ffmpeg -hide_banner -i assets/final/audio/night-room-loop.ogg \
  -af loudnorm=print_format=json -f null -

ffmpeg -hide_banner -i assets/final/audio/night-room-loop.ogg \
  -af volumedetect -f null -

shasum -a 256 \
  assets/final/audio/night-room-loop.ogg \
  cocos-project/assets/resources/audio/night-room-loop.ogg
```
