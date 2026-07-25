c:\uni-app_Project\test01_7_22\pages\control\control.vue
<template>
	<view class="container">
		<view class="status-bar">
			<view class="status-left">
				<text class="status-label">当前状态</text>
				<text class="status-value">{{ currentStatus }}</text>
			</view>
			<view class="connection-status" :class="{ connected: isConnected }">
				<text class="connection-icon">{{ isConnected ? '✅' : '❌' }}</text>
				<text class="connection-text">{{ isConnected ? '已连接' : '未连接' }}</text>
			</view>
		</view>
		
		<view class="control-panel">
			<view class="left-panel">
				<view class="control-btn btn-up" @touchstart="sendCommand('f')" @touchend="sendCommand('s')">
					<text class="btn-icon">↑</text>
					<text class="btn-text">前进</text>
				</view>
				<view class="control-btn btn-down" @touchstart="sendCommand('b')" @touchend="sendCommand('s')">
					<text class="btn-icon">↓</text>
					<text class="btn-text">后退</text>
				</view>
			</view>
			
			<view class="right-panel">
				<view class="control-btn btn-left" @touchstart="sendCommand('l')" @touchend="sendCommand('s')">
					<text class="btn-icon">←</text>
					<text class="btn-text">左转</text>
				</view>
				<view class="control-btn btn-right" @touchstart="sendCommand('r')" @touchend="sendCommand('s')">
					<text class="btn-icon">→</text>
					<text class="btn-text">右转</text>
				</view>
			</view>
		</view>
		
		<view class="tips">
			<text class="tips-text">按住按钮控制小车移动</text>
			<text class="tips-hint" v-if="!isConnected">⚠️ 请先连接蓝牙设备</text>
		</view>
	</view>
</template>

<script>
	import bluetoothManager from '@/utils/bluetooth.js'
	
	export default {
		data() {
			return {
				currentStatus: '停止',
				isConnected: false,
				isSending: false // 防止重复发送
			}
		},
		onLoad() {
			this.isConnected = bluetoothManager.getIsConnected()
			bluetoothManager.addListener(this.onConnectionChange)
		},
		onUnload() {
			bluetoothManager.removeListener(this.onConnectionChange)
		},
		methods: {
			onConnectionChange(device, isConnected) {
				this.isConnected = isConnected
			},
			
			sendCommand(cmd) {
				if (!this.isConnected) {
					uni.showToast({ title: '请先连接蓝牙', icon: 'none' })
					return
				}
				
				const statusMap = { 'f': '前进', 'b': '后退', 'l': '左转', 'r': '右转', 's': '停止' }
				this.currentStatus = statusMap[cmd] || cmd
				
				// 发送命令（单个字符）
				bluetoothManager.sendData(cmd).then(() => {
					console.log('命令发送成功:', cmd)
				}).catch((err) => {
					console.error('命令发送失败:', err)
				})
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
		display: flex; flex-direction: column; padding: 30rpx;
		padding-top: calc(env(safe-area-inset-top) + 30rpx); box-sizing: border-box;
	}
	.status-bar {
		display: flex; justify-content: space-between; align-items: center;
		background: rgba(255,255,255,0.1); border-radius: 20rpx; padding: 30rpx 40rpx;
		margin-bottom: 60rpx;
	}
	.status-left { display: flex; flex-direction: column; }
	.status-label { font-size: 28rpx; color: rgba(255,255,255,0.7); margin-bottom: 8rpx; }
	.status-value { font-size: 48rpx; color: #fff; font-weight: bold; }
	.connection-status {
		display: flex; flex-direction: column; align-items: center;
		padding: 20rpx 30rpx; background: rgba(255, 255, 255, 0.1); border-radius: 16rpx;
		&.connected { background: rgba(76, 175, 80, 0.3); }
	}
	.connection-icon { font-size: 32rpx; margin-bottom: 8rpx; }
	.connection-text { font-size: 24rpx; color: #fff; }
	
	.control-panel { flex: 1; display: flex; justify-content: space-between; padding: 0 20rpx; }
	.left-panel, .right-panel { display: flex; flex-direction: column; gap: 40rpx; }
	.control-btn {
		width: 180rpx; height: 180rpx; border-radius: 24rpx;
		display: flex; flex-direction: column; align-items: center; justify-content: center;
		transition: all 0.2s ease; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.3);
		&:active { transform: scale(0.95); opacity: 0.8; }
	}
	.btn-up { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
	.btn-down { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
	.btn-left { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
	.btn-right { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); }
	.btn-icon { font-size: 56rpx; color: #fff; margin-bottom: 8rpx; }
	.btn-text { font-size: 28rpx; color: #fff; font-weight: 600; }
	
	.tips { text-align: center; padding: 30rpx 0; }
	.tips-text { font-size: 26rpx; color: rgba(255,255,255,0.5); display: block; margin-bottom: 10rpx; }
	.tips-hint { font-size: 24rpx; color: #ff9800; }
</style>