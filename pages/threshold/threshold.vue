c:\uni-app_Project\test01_7_22\pages\threshold\threshold.vue
<template>
	<view class="container">
		<view class="content">
			<view class="section">
				<text class="section-title">阈值设置</text>
				<text class="section-hint">单位：克 (g)</text>
			</view>
			
			<view class="input-box">
				<input 
					class="threshold-input" 
					type="digit" 
					v-model="threshold" 
					placeholder="请输入阈值"
					placeholder-class="input-placeholder"
				/>
				<text class="input-unit">g</text>
			</view>
			
			<view class="preview-box">
				<text class="preview-label">发送命令：</text>
				<text class="preview-value">t{{ threshold || 'xxx' }}</text>
			</view>
			
			<view class="button-area">
				<view class="confirm-btn" @click="confirmThreshold">
					<text class="btn-text">确认设置</text>
				</view>
			</view>
			
			<view class="connection-status" :class="{ connected: isConnected }">
				<text class="status-icon">{{ isConnected ? '✅' : '❌' }}</text>
				<text class="status-text">{{ isConnected ? '已连接蓝牙' : '未连接蓝牙' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import bluetoothManager from '@/utils/bluetooth.js'
	
	export default {
		data() {
			return {
				threshold: '',
				isConnected: false
			}
		},
		onLoad() {
			this.isConnected = bluetoothManager.getIsConnected()
			bluetoothManager.addListener(this.onConnectionChange)
			
			// 读取本地保存的阈值
			const savedThreshold = uni.getStorageSync('threshold')
			if (savedThreshold) {
				this.threshold = savedThreshold.toString()
			}
		},
		onUnload() {
			bluetoothManager.removeListener(this.onConnectionChange)
		},
		methods: {
			onConnectionChange(device, isConnected) {
				this.isConnected = isConnected
			},
			
			confirmThreshold() {
				if (!this.threshold || isNaN(this.threshold)) {
					uni.showToast({
						title: '请输入有效数值',
						icon: 'none'
					})
					return
				}
				
				const value = parseFloat(this.threshold)
				if (value <= 0) {
					uni.showToast({
						title: '阈值必须大于0',
						icon: 'none'
					})
					return
				}
				
				// 保存到本地
				uni.setStorageSync('threshold', value)
				
				// 如果已连接蓝牙，发送阈值命令
				if (this.isConnected) {
					const cmd = `t${value.toFixed(1)}` // 格式：t50.0
					bluetoothManager.sendData(cmd).then(() => {
						uni.showToast({
							title: '设置成功',
							icon: 'success'
						})
					}).catch((err) => {
						console.error('发送失败:', err)
						uni.showToast({
							title: '设置成功（蓝牙未发送）',
							icon: 'none'
						})
					})
				} else {
					uni.showToast({
						title: '设置成功（未连接蓝牙）',
						icon: 'none'
					})
				}
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background: #f5f5f5;
	}
	
	.content {
		padding: 40rpx 30rpx;
	}
	
	.section {
		margin-bottom: 40rpx;
	}
	
	.section-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
		display: block;
	}
	
	.section-hint {
		font-size: 26rpx;
		color: #999;
		margin-top: 10rpx;
		display: block;
	}
	
	.input-box {
		display: flex;
		align-items: center;
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 30rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	
	.threshold-input {
		flex: 1;
		font-size: 48rpx;
		font-weight: bold;
		color: #333;
		text-align: center;
	}
	
	.input-placeholder {
		color: #ccc;
	}
	
	.input-unit {
		font-size: 32rpx;
		color: #667eea;
		font-weight: 600;
	}
	
	.preview-box {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20rpx;
		background: #f0f0f0;
		border-radius: 12rpx;
		margin-bottom: 40rpx;
	}
	
	.preview-label {
		font-size: 28rpx;
		color: #666;
	}
	
	.preview-value {
		font-size: 28rpx;
		color: #667eea;
		font-weight: bold;
		margin-left: 10rpx;
	}
	
	.button-area {
		margin-bottom: 30rpx;
	}
	
	.confirm-btn {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 20rpx;
		padding: 30rpx;
		text-align: center;
	}
	
	.btn-text {
		font-size: 32rpx;
		color: #fff;
		font-weight: bold;
	}
	
	.connection-status {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20rpx;
		background: rgba(255, 87, 87, 0.1);
		border-radius: 12rpx;
		
		&.connected {
			background: rgba(76, 175, 80, 0.1);
		}
	}
	
	.status-icon {
		font-size: 28rpx;
		margin-right: 10rpx;
	}
	
	.status-text {
		font-size: 26rpx;
		color: #e53935;
		
		.connected & {
			color: #4caf50;
		}
	}
</style>