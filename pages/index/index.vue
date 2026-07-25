c:\uni-app_Project\test01_7_22\pages\index\index.vue
<template>
	<view class="container">
		<view class="header">
			<text class="title">小车控制器</text>
			<view class="connection-indicator" :class="{ connected: isConnected }">
				<text class="indicator-dot"></text>
				<text class="indicator-text">{{ isConnected ? '已连接' : '未连接' }}</text>
			</view>
		</view>
		
		<view class="button-list">
			<view class="btn-item" @click="goToBluetooth">
				<view class="btn-icon blue-icon">
					<text class="icon-text">BT</text>
				</view>
				<view class="btn-content">
					<text class="btn-title">蓝牙连接</text>
					<text class="btn-desc">连接小车蓝牙模块</text>
				</view>
				<view class="btn-arrow">
					<text class="arrow-text">›</text>
				</view>
			</view>
			
			<view class="btn-item" @click="goToThreshold">
				<view class="btn-icon orange-icon">
					<text class="icon-text">SE</text>
				</view>
				<view class="btn-content">
					<text class="btn-title">阈值设置</text>
					<text class="btn-desc">设置重量检测阈值</text>
				</view>
				<view class="btn-arrow">
					<text class="arrow-text">›</text>
				</view>
			</view>
			
			<view class="btn-item auto-item" @click="toggleAutoCruise">
				<view class="btn-icon" :class="autoCruise ? 'green-icon' : 'gray-icon'">
					<text class="icon-text">{{ autoCruise ? 'ON' : 'OF' }}</text>
				</view>
				<view class="btn-content">
					<text class="btn-title">自动巡检</text>
					<text class="btn-desc">{{ autoCruise ? '巡航中' : '点击开启' }}</text>
				</view>
				<view class="toggle-switch" :class="{ active: autoCruise }">
					<view class="toggle-thumb"></view>
				</view>
			</view>
			
			<view class="btn-item" @click="goToControl">
				<view class="btn-icon purple-icon">
					<text class="icon-text">CT</text>
				</view>
				<view class="btn-content">
					<text class="btn-title">小车控制</text>
					<text class="btn-desc">手动控制小车移动</text>
				</view>
				<view class="btn-arrow">
					<text class="arrow-text">›</text>
				</view>
			</view>
		</view>
		
		<view class="footer">
			<text class="footer-text">蓝牙命令协议：f前进 b后退 l左转 r右转 s停止</text>
		</view>
	</view>
</template>

<script>
	import bluetoothManager from '@/utils/bluetooth.js'
	
	export default {
		data() {
			return {
				isConnected: false,
				autoCruise: false
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
			
			goToBluetooth() {
				uni.navigateTo({
					url: '/pages/bluetooth/bluetooth'
				})
			},
			
			goToThreshold() {
				uni.navigateTo({
					url: '/pages/threshold/threshold'
				})
			},
			
			goToControl() {
				uni.navigateTo({
					url: '/pages/control/control'
				})
			},
			
			toggleAutoCruise() {
				this.autoCruise = !this.autoCruise
				
				if (!this.isConnected) {
					uni.showToast({
						title: '请先连接蓝牙',
						icon: 'none'
					})
					this.autoCruise = false
					return
				}
				
				// 发送自动巡航命令
				const cmd = this.autoCruise ? 'c1' : 'c0'
				bluetoothManager.sendData(cmd).then(() => {
					uni.showToast({
						title: this.autoCruise ? '已开启自动巡航' : '已关闭自动巡航',
						icon: 'success'
					})
				}).catch((err) => {
					console.error('发送失败:', err)
					this.autoCruise = !this.autoCruise
					uni.showToast({
						title: '发送失败',
						icon: 'none'
					})
				})
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 30rpx;
		padding-top: calc(env(safe-area-inset-top) + 30rpx);
		box-sizing: border-box;
	}
	
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 50rpx;
	}
	
	.title {
		font-size: 48rpx;
		font-weight: bold;
		color: #fff;
	}
	
	.connection-indicator {
		display: flex;
		align-items: center;
		padding: 15rpx 25rpx;
		background: rgba(255,255,255,0.2);
		border-radius: 40rpx;
		
		&.connected {
			background: rgba(76, 175, 80, 0.8);
		}
	}
	
	.indicator-dot {
		width: 16rpx;
		height: 16rpx;
		background: #fff;
		border-radius: 50%;
		margin-right: 10rpx;
	}
	
	.indicator-text {
		font-size: 26rpx;
		color: #fff;
		font-weight: 600;
	}
	
	.button-list {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 30rpx;
	}
	
	.btn-item {
		display: flex;
		align-items: center;
		width: 100%;
		max-width: 600rpx;
		background: rgba(255,255,255,0.95);
		border-radius: 24rpx;
		padding: 35rpx 30rpx;
		margin-bottom: 25rpx;
		box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.15);
		
		&:active {
			transform: scale(0.98);
		}
	}
	
	.btn-icon {
		width: 80rpx;
		height: 80rpx;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 25rpx;
	}
	
	.blue-icon {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}
	
	.orange-icon {
		background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
	}
	
	.green-icon {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
	}
	
	.gray-icon {
		background: #ccc;
	}
	
	.purple-icon {
		background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
	}
	
	.icon-text {
		font-size: 24rpx;
		color: #fff;
		font-weight: bold;
	}
	
	.btn-content {
		flex: 1;
	}
	
	.btn-title {
		font-size: 32rpx;
		color: #333;
		font-weight: 600;
		display: block;
		margin-bottom: 8rpx;
	}
	
	.btn-desc {
		font-size: 24rpx;
		color: #999;
	}
	
	.btn-arrow {
		margin-left: 20rpx;
	}
	
	.arrow-text {
		font-size: 40rpx;
		color: #ccc;
	}
	
	.toggle-switch {
		width: 100rpx;
		height: 56rpx;
		background: #ccc;
		border-radius: 28rpx;
		position: relative;
		transition: all 0.3s ease;
		
		&.active {
			background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
		}
	}
	
	.toggle-thumb {
		width: 52rpx;
		height: 52rpx;
		background: #fff;
		border-radius: 50%;
		position: absolute;
		top: 2rpx;
		left: 2rpx;
		transition: all 0.3s ease;
		box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.2);
		
		.toggle-switch.active & {
			left: 46rpx;
		}
	}
	
	.footer {
		text-align: center;
		padding: 40rpx 0;
	}
	
	.footer-text {
		font-size: 22rpx;
		color: rgba(255,255,255,0.7);
	}
</style>