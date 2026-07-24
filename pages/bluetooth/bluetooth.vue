c:\uni-app_Project\test01_7_22\pages\bluetooth\bluetooth.vue
<template>
	<view class="container">
		<view class="header">
			<view class="action-btn" :class="{ scanning: scanning }" @click="toggleScan">
				<text class="action-text">{{ scanning ? '停止扫描' : '开始扫描' }}</text>
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
				<text class="empty-icon">📶</text>
				<text class="empty-text">暂无蓝牙设备</text>
				<text class="empty-hint">点击右上角扫描按钮搜索设备</text>
			</view>
			
			<view v-else class="device-item" v-for="(device, index) in devices" :key="index">
				<view class="device-icon">
					<text class="icon-text">{{ device.connected ? '✅' : '📱' }}</text>
				</view>
				<view class="device-detail">
					<text class="device-name">{{ truncateName(device.name) || '未知设备' }}</text>
					<text class="device-mac">{{ device.deviceId }}</text>
				</view>
				<view class="device-action">
					<view v-if="!device.connected" class="connect-btn" @click="connectDevice(device)">
						<text class="btn-text">连接</text>
					</view>
					<view v-else class="disconnect-btn" @click="disconnectDevice(device)">
						<text class="btn-text">断开</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="connected-hint" v-if="connectedDevice">
			<text class="hint-text">已连接: {{ truncateName(connectedDevice.name) || connectedDevice.deviceId }}</text>
			<view class="debug-info">
				<text class="debug-text">服务数: {{ serviceCount }}</text>
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
				connectedDevice: null,
				scanTimer: null,
				serviceCount: 0,
				deviceServices: [],
				deviceCharacteristics: []
			}
		},
		onLoad() {
			this.startScan()
		},
		methods: {
			truncateName(name) {
				if (!name) return null
				if (name.length > 12) {
					return name.substring(0, 12) + '...'
				}
				return name
			},
			
			toggleScan() {
				if (this.scanning) {
					this.stopScan()
				} else {
					this.startScan()
				}
			},
			
			startScan() {
				this.scanning = true
				this.devices = []
				this.serviceCount = 0
				this.deviceServices = []
				this.deviceCharacteristics = []
				
				uni.openBluetoothAdapter({
					success: (res) => {
						console.log('蓝牙适配器打开成功:', res)
						uni.startBluetoothDevicesDiscovery({
							allowDuplicatesKey: false,
							success: (res) => {
								console.log('开始扫描:', res)
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
								
								this.scanTimer = setTimeout(() => {
									this.stopScan()
								}, 5000)
							},
							fail: (err) => {
								console.error('扫描失败:', err)
								if (err.code === 10016) {
									uni.showModal({
										title: '位置服务未开启',
										content: '请在系统设置中开启位置服务',
										showCancel: false
									})
								} else {
									uni.showToast({
										title: '扫描失败: ' + err.errMsg,
										icon: 'none'
									})
								}
								this.scanning = false
							}
						})
					},
					fail: (err) => {
						console.error('蓝牙适配器打开失败:', err)
						uni.showModal({
							title: '蓝牙未开启',
							content: '请在系统设置中开启蓝牙',
							showCancel: false
						})
						this.scanning = false
					}
				})
			},
			
			stopScan() {
				this.scanning = false
				if (this.scanTimer) {
					clearTimeout(this.scanTimer)
					this.scanTimer = null
				}
				uni.stopBluetoothDevicesDiscovery({
					success: (res) => {
						console.log('停止扫描:', res)
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
				
				uni.showLoading({ title: '连接中...' })
				
				// 步骤1: 创建BLE连接
				uni.createBLEConnection({
					deviceId: device.deviceId,
					success: (res) => {
						console.log('BLE连接创建成功:', res)
						
						// 步骤2: 发现设备服务
						uni.getBLEDeviceServices({
							deviceId: device.deviceId,
							success: (servicesRes) => {
								console.log('发现服务:', servicesRes)
								this.deviceServices = servicesRes.services
								this.serviceCount = servicesRes.services.length
								
								// 步骤3: 发现特征（以第一个服务为例）
								if (servicesRes.services.length > 0) {
									this.discoverCharacteristics(device.deviceId, servicesRes.services[0].uuid)
								}
								
								device.connected = true
								this.connectedDevice = device
								uni.hideLoading()
								uni.showToast({
									title: '连接成功',
									icon: 'success'
								})
							},
							fail: (err) => {
								console.error('发现服务失败:', err)
								uni.hideLoading()
								uni.showToast({
									title: '发现服务失败',
									icon: 'none'
								})
							}
						})
					},
					fail: (err) => {
						console.error('BLE连接失败:', err)
						uni.hideLoading()
						uni.showToast({
							title: '连接失败: ' + err.errMsg,
							icon: 'none'
						})
					}
				})
			},
			
			discoverCharacteristics(deviceId, serviceId) {
				uni.getBLEDeviceCharacteristics({
					deviceId: deviceId,
					serviceId: serviceId,
					success: (res) => {
						console.log('发现特征:', res)
						this.deviceCharacteristics = res.characteristics
					},
					fail: (err) => {
						console.error('发现特征失败:', err)
					}
				})
			},
			
			disconnectDevice(device) {
				uni.showLoading({ title: '断开中...' })
				
				uni.closeBLEConnection({
					deviceId: device.deviceId,
					success: (res) => {
						console.log('断开连接:', res)
						device.connected = false
						this.connectedDevice = null
						this.serviceCount = 0
						this.deviceServices = []
						this.deviceCharacteristics = []
						uni.hideLoading()
						uni.showToast({
							title: '已断开连接',
							icon: 'none'
						})
					},
					fail: (err) => {
						console.error('断开失败:', err)
						uni.hideLoading()
						uni.showToast({
							title: '断开失败: ' + err.errMsg,
							icon: 'none'
						})
					}
				})
			}
		},
		onUnload() {
			this.stopScan()
			if (this.connectedDevice) {
				this.disconnectDevice(this.connectedDevice)
			}
			uni.closeBluetoothAdapter({
				success: (res) => {
					console.log('蓝牙适配器关闭:', res)
				}
			})
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background: #f5f5f5;
	}
	
	.header {
		display: flex;
		justify-content: flex-end;
		padding: 30rpx;
		background: #fff;
	}
	
	.action-btn {
		padding: 20rpx 40rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 40rpx;
		
		&.scanning {
			background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		}
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
		margin-bottom: 30rpx;
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
		font-size: 36rpx;
	}
	
	.device-detail {
		flex: 1;
		overflow: hidden;
	}
	
	.device-name {
		font-size: 32rpx;
		color: #333;
		font-weight: 600;
		margin-bottom: 8rpx;
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.device-mac {
		font-size: 24rpx;
		color: #999;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.device-action {
		margin-left: 20rpx;
	}
	
	.connect-btn {
		padding: 20rpx 40rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 40rpx;
	}
	
	.disconnect-btn {
		padding: 20rpx 40rpx;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		border-radius: 40rpx;
	}
	
	.btn-text {
		font-size: 28rpx;
		color: #fff;
		font-weight: 600;
	}
	
	.connected-hint {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 30rpx;
		background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
		text-align: center;
	}
	
	.hint-text {
		font-size: 28rpx;
		color: #fff;
		font-weight: 600;
		display: block;
		margin-bottom: 8rpx;
	}
	
	.debug-info {
		margin-top: 10rpx;
	}
	
	.debug-text {
		font-size: 24rpx;
		color: rgba(255,255,255,0.8);
	}
</style>