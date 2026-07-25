c:\uni-app_Project\test01_7_22\pages\index\index.vue
<template>
	<view class="container">
		<view class="main-title">
			<text class="title-text">小车控制器</text>
			<text class="subtitle-text">智能蓝牙控制终端</text>
		</view>
		
		<view class="connection-status-bar" :class="{ connected: isConnected }">
			<text class="status-icon">{{ isConnected ? '✅' : '🔴' }}</text>
			<text class="status-text">{{ isConnected ? '已连接设备' : '未连接蓝牙' }}</text>
		</view>
		
		<view class="button-grid">
			<view class="btn-item" @click="goToBluetooth">
				<view class="btn-icon-wrap">
					<text class="btn-icon">🔗</text>
				</view>
				<text class="btn-text">蓝牙连接</text>
			</view>
			
			<view class="btn-item" @click="goToThreshold">
				<view class="btn-icon-wrap">
					<text class="btn-icon">⚖️</text>
				</view>
				<text class="btn-text">阈值设置</text>
			</view>
			
			<view class="btn-item auto-btn" :class="{ active: autoCruiseEnabled }" @click="toggleAutoCruise">
				<view class="btn-icon-wrap">
					<text class="btn-icon">{{ autoCruiseEnabled ? '🔄' : '⏸️' }}</text>
				</view>
				<text class="btn-text">{{ autoCruiseEnabled ? '关闭巡检' : '自动巡检' }}</text>
			</view>
			
			<view class="btn-item" @click="goToControl">
				<view class="btn-icon-wrap">
					<text class="btn-icon">🎮</text>
				</view>
				<text class="btn-text">小车控制</text>
			</view>
		</view>
		
		<view class="info-panel">
			<view class="info-item">
				<text class="info-icon">📡</text>
				<text class="info-text">蓝牙连接状态: {{ isConnected ? '已连接' : '未连接' }}</text>
			</view>
			<view class="info-item">
				<text class="info-icon">🚀</text>
				<text class="info-text">自动巡检: {{ autoCruiseEnabled ? '开启' : '关闭' }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import bluetoothManager from '@/utils/bluetooth.js'
	
	export default {
		data() {
			return {
				isConnected: false,
				autoCruiseEnabled: false
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
				uni.navigateTo({ url: '/pages/bluetooth/bluetooth' })
			},
			
			goToThreshold() {
				uni.navigateTo({ url: '/pages/threshold/threshold' })
			},
			
			goToControl() {
				uni.navigateTo({ url: '/pages/control/control' })
			},
			
			toggleAutoCruise() {
				if (!this.isConnected) {
					uni.showToast({ title: '请先连接蓝牙', icon: 'none' })
					return
				}
				
				const newValue = !this.autoCruiseEnabled
				
				uni.showLoading({ title: newValue ? '开启中...' : '关闭中...' })
				
				bluetoothManager.sendCommand('autoCruise', newValue).then(() => {
					uni.hideLoading()
					this.autoCruiseEnabled = newValue
					uni.showToast({ 
						title: newValue ? '自动巡检已开启' : '自动巡检已关闭', 
						icon: 'none' 
					})
				}).catch((err) => {
					uni.hideLoading()
					console.error('操作失败:', err)
					uni.showToast({ title: '操作失败', icon: 'none' })
				})
			}
		}
	}
</script>

<style lang="scss">
	.container { min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30rpx; }
	.main-title { text-align: center; padding: 60rpx 0 40rpx; }
	.title-text { font-size: 48rpx; color: #fff; font-weight: bold; display: block; margin-bottom: 15rpx; }
	.subtitle-text { font-size: 28rpx; color: rgba(255,255,255,0.8); }
	
	.connection-status-bar {
		display: flex; align-items: center; justify-content: center;
		padding: 20rpx; background: rgba(255,255,255,0.2); border-radius: 40rpx;
		margin-bottom: 40rpx;
		&.connected { background: rgba(76, 175, 80, 0.3); }
	}
	.status-icon { font-size: 32rpx; margin-right: 15rpx; }
	.status-text { font-size: 28rpx; color: #fff; }
	
	.button-grid {
		display: grid; grid-template-columns: repeat(2, 1fr); gap: 30rpx;
		margin-bottom: 40rpx;
	}
	.btn-item {
		background: rgba(255,255,255,0.95); border-radius: 24rpx;
		padding: 40rpx 30rpx; display: flex; flex-direction: column;
		align-items: center; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.1);
		transition: all 0.3s ease;
		&:active { transform: scale(0.96); }
	}
	.btn-icon-wrap {
		width: 100rpx; height: 100rpx; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 50%; display: flex; align-items: center; justify-content: center;
		margin-bottom: 20rpx;
	}
	.auto-btn.active .btn-icon-wrap {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
	}
	.btn-icon { font-size: 48rpx; }
	.btn-text { font-size: 30rpx; color: #333; font-weight: 600; }
	
	.info-panel {
		background: rgba(255,255,255,0.95); border-radius: 24rpx;
		padding: 30rpx; box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.1);
	}
	.info-item {
		display: flex; align-items: center; padding: 15rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
		&:last-child { border-bottom: none; }
	}
	.info-icon { font-size: 28rpx; margin-right: 15rpx; }
	.info-text { font-size: 28rpx; color: #666; }
</style>