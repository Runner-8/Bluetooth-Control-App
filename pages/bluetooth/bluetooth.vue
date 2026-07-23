c:\uni-app_Project\test01_7_22\pages\bluetooth\bluetooth.vue
<template>
	<view class="container">
		<view class="nav-bar">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="nav-title">蓝牙连接</text>
			<view class="action-btn" @click="scanBluetooth">
				<text class="action-text">{{ scanning ? '停止' : '扫描' }}</text>
			</view>
		</view>
		
		<view class="scan-status" v-if="scanning">
			<view class="loading-dot">
				<view class="dot"></view>
				<view class="dot"></view>
				<view class="dot"></view>
			</view>
			<text class="scan-text">正在搜索蓝牙设备...</text>
		</view>
		
		<view class="device-list" v-else>
			<view v-if="devices.length === 0" class="empty-state">
				<text class="empty-icon">BT</text>
				<text class="empty-text">暂无蓝牙设备</text>
				<text class="empty-hint">点击右上角扫描按钮搜索设备</text>
			</view>
			
			<view v-else class="device-item" v-for="(device, index) in devices" :key="index" @click="connectDevice(device)">
				<view class="device-icon">
					<text class="icon-text">DV</text>
				</view>
				<view class="device-info">
					<text class="device-name">{{ device.name || '未知设备' }}</text>
					<text class="device-mac">{{ device.deviceId }}</text>
				</view>
				<view class="connect-btn" :class="{ connected: device.connected }">
					<text class="connect-text">{{ device.connected ? '已连接' : '连接' }}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				scanning: false,
				devices: [],
				connectedDevice: null
			}
		},
		onLoad() {
			
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			
			scanBluetooth() {
				if (this.scanning) {
					this.scanning = false
					uni.stopBluetoothDevicesDiscovery()
					return
				}
				
				this.scanning = true
				this.devices = []
				
				uni.openBluetoothAdapter({
					success: () => {
						uni.startBluetoothDevicesDiscovery({
							allowDuplicatesKey: false,
							success: () => {
								uni.onBluetoothDeviceFound((res) => {
									const device = res.devices[0]
									if (device && device.deviceId) {
										const exists = this.devices.some(d => d.deviceId === device.deviceId)
										if (!exists) {
											this.devices.push({
												name: device.name,
												deviceId: device.deviceId,
												connected: false
											})
										}
									}
								})
							},
							fail: (err) => {
								console.error(err)
								uni.showToast({
									title: '扫描失败',
									icon: 'none'
								})
								this.scanning = false
							}
						})
					},
					fail: (err) => {
						console.error(err)
						uni.showToast({
							title: '请开启蓝牙',
							icon: 'none'
						})
						this.scanning = false
					}
				})
			},
			
			connectDevice(device) {
				if (device.connected) {
					uni.showToast({
						title: '已连接此设备',
						icon: 'none'
					})
					return
				}
				
				uni.createBLEConnection({
					deviceId: device.deviceId,
					success: () => {
						device.connected = true
						this.connectedDevice = device
						uni.showToast({
							title: '连接成功',
							icon: 'success'
						})
					},
					fail: (err) => {
						console.error(err)
						uni.showToast({
							title: '连接失败',
							icon: 'none'
						})
					}
				})
			}
		},
		onUnload() {
			if (this.scanning) {
				uni.stopBluetoothDevicesDiscovery()
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background: #f5f5f5;
	}
	
	.nav-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 40rpx 30rpx;
		background: #fff;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.1);
	}
	
	.back-btn {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f0f0;
		border-radius: 50%;
	}
	
	.back-icon {
		font-size: 40rpx;
		color: #333;
	}
	
	.nav-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #333;
	}
	
	.action-btn {
		padding: 16rpx 32rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 40rpx;
	}
	
	.action-text {
		font-size: 28rpx;
		color: #fff;
		font-weight: 600;
	}
	
	.scan-status {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 100rpx 0;
	}
	
	.loading-dot {
		display: flex;
		align-items: center;
		margin-bottom: 30rpx;
	}
	
	.dot {
		width: 20rpx;
		height: 20rpx;
		background: #667eea;
		border-radius: 50%;
		margin: 0 10rpx;
		animation: dotPulse 1s infinite;
		
		&:nth-child(2) {
			animation-delay: 0.2s;
		}
		
		&:nth-child(3) {
			animation-delay: 0.4s;
		}
	}
	
	@keyframes dotPulse {
		0%, 100% {
			transform: scale(1);
			opacity: 1;
		}
		50% {
			transform: scale(1.5);
			opacity: 0.5;
		}
	}
	
	.scan-text {
		font-size: 30rpx;
		color: #666;
	}
	
	.device-list {
		padding: 30rpx;
	}
	
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 100rpx 0;
	}
	
	.empty-icon {
		font-size: 120rpx;
		color: #667eea;
		margin-bottom: 30rpx;
		font-weight: bold;
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #333;
		margin-bottom: 15rpx;
	}
	
	.empty-hint {
		font-size: 26rpx;
		color: #999;
	}
	
	.device-item {
		display: flex;
		align-items: center;
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	
	.device-icon {
		width: 80rpx;
		height: 80rpx;
		background: #f0f0f0;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-right: 20rpx;
	}
	
	.icon-text {
		font-size: 24rpx;
		color: #667eea;
		font-weight: bold;
	}
	
	.device-info {
		flex: 1;
	}
	
	.device-name {
		font-size: 32rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 8rpx;
	}
	
	.device-mac {
		font-size: 24rpx;
		color: #999;
	}
	
	.connect-btn {
		padding: 16rpx 32rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 40rpx;
		
		&.connected {
			background: #ccc;
		}
	}
	
	.connect-text {
		font-size: 26rpx;
		color: #fff;
		font-weight: 600;
	}
</style>