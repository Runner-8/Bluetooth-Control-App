
class BluetoothManager {
	constructor() {
		this.connectedDevice = null
		this.socket = null
		this.isConnected = false
		this.listeners = []
		this.connectionType = null
		this.sendQueue = []
		this.isSending = false
		this.connectionChecker = null
		this.lastSendTime = 0
		this.MAX_IDLE_TIME = 5000
	}
	
	setConnectedDevice(device, type = 'classic') {
		this.connectedDevice = device
		this.isConnected = device !== null
		this.connectionType = type
		this.notifyListeners()
		
		if (this.isConnected) {
			this.startConnectionChecker()
		} else {
			this.stopConnectionChecker()
		}
	}
	
	setSocket(socket) {
		this.socket = socket
	}
	
	getConnectedDevice() {
		return this.connectedDevice
	}
	
	getIsConnected() {
		return this.isConnected
	}
	
	getConnectionType() {
		return this.connectionType
	}
	
	addListener(listener) {
		this.listeners.push(listener)
	}
	
	removeListener(listener) {
		this.listeners = this.listeners.filter(l => l !== listener)
	}
	
	notifyListeners() {
		this.listeners.forEach(listener => {
			listener(this.connectedDevice, this.isConnected)
		})
	}
	
	startConnectionChecker() {
		this.stopConnectionChecker()
		
		this.connectionChecker = setInterval(() => {
			this.checkConnectionStatus()
		}, 2000)
	}
	
	stopConnectionChecker() {
		if (this.connectionChecker) {
			clearInterval(this.connectionChecker)
			this.connectionChecker = null
		}
	}
	
	checkConnectionStatus() {
		if (!this.isConnected || !this.connectedDevice) {
			this.stopConnectionChecker()
			return
		}
		
		const now = Date.now()
		
		if (now - this.lastSendTime > this.MAX_IDLE_TIME) {
			this.tryPingConnection()
		}
	}
	
	tryPingConnection() {
		if (this.connectionType === 'classic' && this.socket) {
			try {
				if (typeof this.socket.readyState !== 'undefined' && this.socket.readyState !== 1) {
					console.log('检测到连接断开')
					this.forceDisconnect()
				}
			} catch (e) {
				console.error('连接检测失败:', e)
				this.forceDisconnect()
			}
		}
	}
	
	forceDisconnect() {
		if (!this.isConnected) return
		
		console.log('强制断开连接')
		this.disconnect().catch(() => {})
	}
	
	sendData(data) {
		return new Promise((resolve, reject) => {
			if (!this.connectedDevice) {
				reject(new Error('未连接设备'))
				return
			}
			
			this.lastSendTime = Date.now()
			
			let sendData = data
			if (!(data instanceof ArrayBuffer)) {
				if (typeof data === 'string') {
					const buffer = new ArrayBuffer(data.length)
					const view = new DataView(buffer)
					for (let i = 0; i < data.length; i++) {
						view.setUint8(i, data.charCodeAt(i))
					}
					sendData = buffer
				} else if (Array.isArray(data)) {
					const buffer = new ArrayBuffer(data.length)
					const view = new DataView(buffer)
					for (let i = 0; i < data.length; i++) {
						view.setUint8(i, data[i])
					}
					sendData = buffer
				} else {
					reject(new Error('无效的数据格式'))
					return
				}
			}
			
			this.sendQueue.push({ data: sendData, resolve, reject })
			
			if (!this.isSending) {
				this.processQueue()
			}
		})
	}
	
	async processQueue() {
		if (this.sendQueue.length === 0) {
			this.isSending = false
			return
		}
		
		this.isSending = true
		const item = this.sendQueue.shift()
		
		try {
			await this.sendSingleData(item.data)
			console.log('发送成功:', this.bytesToHex(item.data))
			item.resolve()
		} catch (err) {
			console.error('发送失败:', err)
			
			if (err.message && err.message.includes('fail')) {
				this.forceDisconnect()
			}
			
			item.reject(err)
		}
		
		setTimeout(() => {
			this.processQueue()
		}, 30)
	}
	
	sendSingleData(data) {
		return new Promise((resolve, reject) => {
			if (this.connectionType === 'classic' && this.socket) {
				this.socket.send({
					data: data,
					success: resolve,
					fail: (err) => reject(new Error(err.errMsg))
				})
			} else {
				reject(new Error('无法发送数据'))
			}
		})
	}
	
	buildFrame(cmd, data = []) {
		const FRAME_HEADER = 0xAA
		const FRAME_TAIL = 0x55
		
		const length = 1 + data.length + 1
		
		let checksum = length ^ cmd
		for (let byte of data) {
			checksum ^= byte
		}
		
		const frame = [FRAME_HEADER, length, cmd, ...data, checksum, FRAME_TAIL]
		
		const buffer = new ArrayBuffer(frame.length)
		const view = new DataView(buffer)
		for (let i = 0; i < frame.length; i++) {
			view.setUint8(i, frame[i])
		}
		
		return buffer
	}
	
	floatToBytes(value) {
		const buffer = new ArrayBuffer(4)
		const view = new DataView(buffer)
		view.setFloat32(0, value, true)
		return [
			view.getUint8(0),
			view.getUint8(1),
			view.getUint8(2),
			view.getUint8(3)
		]
	}
	
	bytesToHex(bytes) {
		if (bytes instanceof ArrayBuffer) {
			bytes = new Uint8Array(bytes)
		}
		return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
	}
	
	sendCommand(cmdType, data = []) {
		const cmdMap = {
			forward: 0x01,
			backward: 0x02,
			left: 0x03,
			right: 0x04,
			stop: 0x05,
			autoCruise: 0x06,
			setThreshold: 0x07,
			uvLight: 0x08,
			autoMove: 0x09,      // 新增：自动移动开关
			queryStatus: 0x0A     // 调整：查询状态改为0x0A
		}
		
		const cmd = cmdMap[cmdType]
		if (!cmd) {
			return Promise.reject(new Error('未知命令类型'))
		}
		
		let frameData = data
		
		if (cmdType === 'setThreshold' && typeof data === 'number') {
			frameData = this.floatToBytes(data)
		} else if (cmdType === 'autoCruise' && typeof data === 'boolean') {
			frameData = [data ? 0x01 : 0x00]
		} else if (cmdType === 'uvLight' && typeof data === 'boolean') {
			frameData = [data ? 0x01 : 0x00]
		} else if (cmdType === 'autoMove' && typeof data === 'boolean') {
			frameData = [data ? 0x01 : 0x00]
		}
		
		const frame = this.buildFrame(cmd, frameData)
		return this.sendData(frame)
	}
	
	disconnect() {
		return new Promise((resolve) => {
			this.stopConnectionChecker()
			this.sendQueue = []
			this.isSending = false
			
			if (this.connectionType === 'classic' && this.socket) {
				try {
					this.socket.close({
						success: () => {
							this.cleanup()
							resolve()
						},
						fail: () => {
							this.cleanup()
							resolve()
						}
					})
				} catch (e) {
					this.cleanup()
					resolve()
				}
			} else if (this.connectionType === 'ble' && this.connectedDevice) {
				uni.closeBLEConnection({
					deviceId: this.connectedDevice.deviceId,
					success: () => {
						this.cleanup()
						resolve()
					},
					fail: () => {
						this.cleanup()
						resolve()
					}
				})
			} else {
				this.cleanup()
				resolve()
			}
		})
	}
	
	cleanup() {
		this.socket = null
		this.connectedDevice = null
		this.isConnected = false
		this.connectionType = null
		this.notifyListeners()
	}
}

const bluetoothManager = new BluetoothManager()

export default bluetoothManager