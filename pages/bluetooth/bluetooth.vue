c:\uni-app_Project\test01_7_22\pages\bluetooth\bluetooth.vue
<template>
	<view class="container">
		<view class="header">
			<view class="action-btn" :class="{ scanning: scanning }" @click="toggleScan">
				<text class="action-text">{{ scanning ? '停止扫描' : '开始扫描' }}</text>
			</view>
		</view>
		
		<view class="mode-tip" v-if="!isAppMode">
			<text class="tip-icon">⚠️</text>
			<text class="tip-text">当前为H5模式，经典蓝牙功能不可用，请使用App模式测试</text>
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
				<text class="empty-hint">请确保蓝牙设备已进入可发现模式</text>
			</view>
			
			<view v-else class="device-item" v-for="(device, index) in devices" :key="index">
				<view class="device-icon" :class="{ connected: device.connected }">
					<text class="icon-text">{{ device.connected ? '✅' : '📱' }}</text>
				</view>
				<view class="device-detail">
					<text class="device-name">{{ getDeviceName(device) }}</text>
					<text class="device-mac">{{ device.deviceId }}</text>
					<text class="device-type" v-if="isJDYDevice(device)">
						⚠️ 经典蓝牙设备（需App模式）
					</text>
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
		
		<view class="connected-hint" v-if="globalConnectedDevice">
			<text class="hint-text">已连接: {{ getDeviceName(globalConnectedDevice) }}</text>
			<text class="hint-type">连接类型: {{ connectionType === 'classic' ? '经典蓝牙' : 'BLE' }}</text>
		</view>
	</view>
</template>

<script>
	import bluetoothManager from '@/utils/bluetooth.js'
	
	export default {
		data() {
			return {
				scanning: false,
				devices: [],
				scanTimer: null,
				globalConnectedDevice: null,
				connectionType: null,
				isAppMode: false
			}
		},
		onLoad() {
			//#ifdef APP-PLUS
			this.isAppMode = true
			//#endif
			
			this.globalConnectedDevice = bluetoothManager.getConnectedDevice()
			this.connectionType = bluetoothManager.getConnectionType()
			bluetoothManager.addListener(this.onConnectionChange)
			
			if (this.globalConnectedDevice) {
				this.updateConnectedDeviceStatus()
			}
			
			this.startScan()
		},
		onUnload() {
			this.stopScan()
			bluetoothManager.removeListener(this.onConnectionChange)
		},
		methods: {
			onConnectionChange(device, isConnected) {
				this.globalConnectedDevice = device
				this.connectionType = bluetoothManager.getConnectionType()
				if (device) {
					this.updateConnectedDeviceStatus()
				} else {
					this.devices.forEach(d => d.connected = false)
				}
			},
			
			updateConnectedDeviceStatus() {
				if (this.globalConnectedDevice) {
					this.devices.forEach(device => {
						if (device.deviceId === this.globalConnectedDevice.deviceId) {
							device.connected = true
						}
					})
				}
			},
			
			isJDYDevice(device) {
				return device.name && (device.name.includes('JDY') || device.name.includes('HC-'))
			},
			
			getDeviceName(device) {
				if (!device) return '未知设备'
				if (device.name && device.name.trim()) {
					if (device.name.length > 15) {
						return device.name.substring(0, 15) + '...'
					}
					return device.name
				}
				if (device.deviceId) {
					return device.deviceId.substring(0, Math.min(12, device.deviceId.length)) + '...'
				}
				return '未知设备'
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
				
				uni.openBluetoothAdapter({
					success: () => {
						console.log('蓝牙适配器打开成功')
						
						uni.onBluetoothDeviceFound((res) => {
							const device = res.devices[0]
							if (device && device.deviceId) {
								this.addDevice(device)
							}
						})
						
						uni.startBluetoothDevicesDiscovery({
							allowDuplicatesKey: false,
							services: [],
							success: () => {
								console.log('开始扫描蓝牙设备')
								this.scanTimer = setTimeout(() => {
									this.stopScan()
								}, 10000)
							},
							fail: (err) => {
								console.error('扫描失败:', err)
								this.handleError(err)
								this.scanning = false
							}
						})
					},
					fail: (err) => {
						console.error('蓝牙适配器打开失败:', err)
						this.handleError(err)
						this.scanning = false
					}
				})
			},
			
			addDevice(device) {
				const exists = this.devices.some(d => d.deviceId === device.deviceId)
				if (exists) return
				
				const newDevice = {
					name: device.name,
					deviceId: device.deviceId,
					connected: false
				}
				
				if (this.globalConnectedDevice && this.globalConnectedDevice.deviceId === device.deviceId) {
					newDevice.connected = true
				}
				
				this.devices.push(newDevice)
			},
			
			stopScan() {
				this.scanning = false
				if (this.scanTimer) {
					clearTimeout(this.scanTimer)
					this.scanTimer = null
				}
				uni.stopBluetoothDevicesDiscovery({
					success: () => {
						console.log('停止扫描')
					}
				})
			},
			
			handleError(err) {
				if (err.code === 10016) {
					uni.showModal({
						title: '位置服务未开启',
						content: '请在系统设置中开启位置服务',
						showCancel: false
					})
				} else if (err.code === 10012) {
					uni.showModal({
						title: '蓝牙未开启',
						content: '请在系统设置中开启蓝牙',
						showCancel: false
					})
				} else {
					uni.showToast({
						title: err.errMsg || '操作失败',
						icon: 'none'
					})
				}
			},
			
			connectDevice(device) {
				if (device.connected) {
					uni.showToast({ title: '已连接此设备', icon: 'none' })
					return
				}
				
				// JDY设备需要App模式
				if (this.isJDYDevice(device) && !this.isAppMode) {
					uni.showModal({
						title: '需要App模式',
						content: 'JDY设备需要在App模式下使用经典蓝牙连接',
						showCancel: false
					})
					return
				}
				
				uni.showLoading({ title: '连接中...' })
				
				if (this.isJDYDevice(device)) {
					this.connectClassicBluetooth(device)
				} else {
					this.connectBLE(device)
				}
			},
			
			connectClassicBluetooth(device) {
				//#ifdef APP-PLUS
				if (uni.createBluetoothSocket) {
					const socket = uni.createBluetoothSocket({ deviceId: device.deviceId })
					
					socket.onOpen(() => {
						console.log('经典蓝牙连接成功')
						device.connected = true
						bluetoothManager.setConnectedDevice(device, 'classic')
						bluetoothManager.setSocket(socket)
						uni.hideLoading()
						uni.showToast({ title: '连接成功', icon: 'success' })
						
						socket.onMessage((res) => {
							console.log('收到数据:', res)
						})
						
						socket.onClose(() => {
							console.log('连接已断开')
							device.connected = false
							bluetoothManager.disconnect()
						})
					})
					
					socket.onError((err) => {
						console.error('经典蓝牙连接失败:', err)
						uni.hideLoading()
						uni.showToast({ title: '连接失败', icon: 'none' })
					})
					
					socket.connect()
				} else {
					//#endif
					uni.hideLoading()
					uni.showToast({ title: '当前平台不支持经典蓝牙', icon: 'none' })
					//#ifdef APP-PLUS
				}
				//#endif
			},
			
			connectBLE(device) {
				uni.createBLEConnection({
					deviceId: device.deviceId,
					success: (res) => {
						console.log('BLE连接成功:', res)
						
						uni.getBLEDeviceServices({
							deviceId: device.deviceId,
							success: (servicesRes) => {
								console.log('发现服务:', servicesRes)
								
								if (servicesRes.services.length > 0) {
									const service = servicesRes.services.find(s => 
										s.uuid.includes('FFE0') || s.uuid.includes('FFF0')
									) || servicesRes.services[0]
									
									uni.getBLEDeviceCharacteristics({
										deviceId: device.deviceId,
										serviceId: service.uuid,
										success: (charsRes) => {
											console.log('发现特征:', charsRes)
											
											const writableChar = charsRes.characteristics.find(ch => 
												ch.properties.write || ch.properties.writeWithoutResponse
											)
											
											if (writableChar) {
												device.connected = true
												bluetoothManager.setConnectedDevice(device, 'classic') // 使用classic类型以便发送数据
												bluetoothManager.setSocket({
													send: (options) => {
														const buffer = new ArrayBuffer(options.data.length)
														const dataView = new DataView(buffer)
														for (let i = 0; i < options.data.length; i++) {
															dataView.setUint8(i, options.data.charCodeAt(i))
														}
														uni.writeBLECharacteristicValue({
															deviceId: device.deviceId,
															serviceId: service.uuid,
															characteristicId: writableChar.uuid,
															value: buffer,
															success: options.success,
															fail: options.fail
														})
													},
													close: (options) => {
														uni.closeBLEConnection({
															deviceId: device.deviceId,
															success: options.success,
															fail: options.fail
														})
													}
												})
												uni.hideLoading()
												uni.showToast({ title: '连接成功', icon: 'success' })
											} else {
												uni.hideLoading()
												uni.showToast({ title: '未找到可写特征', icon: 'none' })
												uni.closeBLEConnection({ deviceId: device.deviceId })
											}
										},
										fail: (err) => {
											console.error('发现特征失败:', err)
											uni.hideLoading()
											uni.showToast({ title: '发现特征失败', icon: 'none' })
											uni.closeBLEConnection({ deviceId: device.deviceId })
										}
									})
								} else {
									uni.hideLoading()
									uni.showToast({ title: '未发现服务', icon: 'none' })
									uni.closeBLEConnection({ deviceId: device.deviceId })
								}
							},
							fail: (err) => {
								console.error('发现服务失败:', err)
								uni.hideLoading()
								uni.showToast({ title: '发现服务失败', icon: 'none' })
								uni.closeBLEConnection({ deviceId: device.deviceId })
							}
						})
					},
					fail: (err) => {
						console.error('BLE连接失败:', err)
						uni.hideLoading()
						uni.showToast({ title: '连接失败', icon: 'none' })
					}
				})
			},
			
			disconnectDevice(device) {
				uni.showLoading({ title: '断开中...' })
				
				bluetoothManager.disconnect().then(() => {
					device.connected = false
					uni.hideLoading()
					uni.showToast({ title: '已断开连接', icon: 'none' })
				}).catch(() => {
					device.connected = false
					bluetoothManager.disconnect()
					uni.hideLoading()
					uni.showToast({ title: '已断开连接', icon: 'none' })
				})
			}
		}
	}
</script>

<style lang="scss">
	.container { min-height: 100vh; background: #f5f5f5; }
	.header { display: flex; justify-content: flex-end; padding: 30rpx; background: #fff; }
	.mode-tip {
		display: flex; align-items: center; padding: 20rpx 30rpx;
		background: #fff3e0; border-bottom: 2rpx solid #ffb74d;
	}
	.tip-icon { font-size: 28rpx; margin-right: 15rpx; }
	.tip-text { font-size: 24rpx; color: #e65100; }
	.action-btn {
		padding: 20rpx 40rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		border-radius: 40rpx;
		&.scanning { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
	}
	.action-text { font-size: 28rpx; color: #fff; font-weight: 600; }
	
	.scan-status { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; }
	.loading-dot { display: flex; align-items: center; margin-bottom: 30rpx; }
	.dot {
		width: 20rpx; height: 20rpx; background: #667eea; border-radius: 50%; margin: 0 10rpx;
		animation: dotPulse 1s infinite;
		&:nth-child(2) { animation-delay: 0.2s; }
		&:nth-child(3) { animation-delay: 0.4s; }
	}
	@keyframes dotPulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.5; } }
	.scan-text { font-size: 32rpx; color: #333; }
	
	.device-list { padding: 30rpx; }
	.empty-state { display: flex; flex-direction: column; align-items: center; padding: 100rpx 0; }
	.empty-icon { font-size: 120rpx; margin-bottom: 30rpx; }
	.empty-text { font-size: 32rpx; color: #333; margin-bottom: 15rpx; }
	.empty-hint { font-size: 26rpx; color: #999; }
	
	.device-item {
		display: flex; align-items: center; background: #fff; border-radius: 20rpx;
		padding: 30rpx; margin-bottom: 20rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.05);
	}
	.device-icon {
		width: 80rpx; height: 80rpx; background: #f0f0f0; border-radius: 50%;
		display: flex; align-items: center; justify-content: center; margin-right: 20rpx;
		&.connected { background: #4caf50; }
	}
	.icon-text { font-size: 36rpx; }
	.device-detail { flex: 1; overflow: hidden; }
	.device-name { font-size: 32rpx; color: #333; font-weight: 600; margin-bottom: 8rpx; display: block; }
	.device-mac { font-size: 24rpx; color: #999; }
	.device-type { font-size: 22rpx; color: #ff9800; margin-top: 8rpx; display: block; }
	.device-action { margin-left: 20rpx; }
	.connect-btn { padding: 20rpx 40rpx; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 40rpx; }
	.disconnect-btn { padding: 20rpx 40rpx; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 40rpx; }
	.btn-text { font-size: 28rpx; color: #fff; font-weight: 600; }
	
	.connected-hint {
		position: fixed; bottom: 0; left: 0; right: 0; padding: 30rpx;
		background: linear-gradient(135deg, #4caf50 0%, #45a049 100%); text-align: center;
	}
	.hint-text { font-size: 28rpx; color: #fff; font-weight: 600; display: block; margin-bottom: 8rpx; }
	.hint-type { font-size: 24rpx; color: rgba(255,255,255,0.8); }
</style>