
class BluetoothManager {
	constructor() {
		this.connectedDevice = null
		this.socket = null
		this.isConnected = false
		this.listeners = []
		this.dataListeners = [] // 数据监听者
		this.connectionType = null
		this.sendQueue = []
		this.isSending = false
		this.connectionChecker = null
		this.lastSendTime = 0
		this.MAX_IDLE_TIME = 5000
		this.receiveBuffer = [] // 接收缓冲区
	}
	
	setConnectedDevice(device, type = 'classic') {
		this.connectedDevice = device
		this.isConnected = device !== null
		this.connectionType = type
		this.notifyListeners()
		
		if (this.isConnected) {
			this.startConnectionChecker()
			this.setupReceiveHandler()
		} else {
			this.stopConnectionChecker()
		}
	}
	
	setSocket(socket) {
		this.socket = socket
	}
	
	setupReceiveHandler() {
		if (this.socket && this.socket.onMessage) {
			this.socket.onMessage((res) => {
				this.onDataReceived(res.data)
			})
		}
	}
	
	onDataReceived(data) {
		// 将数据转换为字节数组
		let bytes = []
		if (data instanceof ArrayBuffer) {
			bytes = Array.from(new Uint8Array(data))
		} else if (data instanceof Uint8Array) {
			bytes = Array.from(data)
		} else if (Array.isArray(data)) {
			bytes = data
		}
		
		// 添加到接收缓冲区
		this.receiveBuffer = this.receiveBuffer.concat(bytes)
		
		// 尝试解析数据帧
		this.parseFrames()
	}
	
	parseFrames() {
		while (this.receiveBuffer.length >= 5) {
			// 查找帧头 0xAA
			const headerIndex = this.receiveBuffer.indexOf(0xAA)
			if (headerIndex === -1) {
				this.receiveBuffer = []
				break
			}
			
			// 如果帧头不是第一个字节，丢弃前面的数据
			if (headerIndex > 0) {
				this.receiveBuffer = this.receiveBuffer.slice(headerIndex)
			}
			
			// 检查最小帧长度（头+长度+命令+校验+尾 = 5字节）
			const minLength = 5
			if (this.receiveBuffer.length < minLength) break
			
			const length = this.receiveBuffer[1]
			// 注意：length字段已经包含命令+数据+校验的总字节数
			// 帧总长度 = 1(头) + 1(长度字节) + length + 1(尾) = 3 + length
			const frameLength = 1 + 1 + length + 1
			
			// 检查是否完整接收
			if (this.receiveBuffer.length < frameLength) break
			
			// 验证帧尾
			if (this.receiveBuffer[frameLength - 1] !== 0x55) {
				this.receiveBuffer = this.receiveBuffer.slice(1)
				continue
			}
			
			// 验证校验：校验 = length ^ cmd ^ data[0] ^ data[1] ^ ...
			let checksum = this.receiveBuffer[1]
			// 从索引2(命令)到索引frameLength-3(最后一个数据字节)
			for (let i = 2; i < frameLength - 2; i++) {
				checksum ^= this.receiveBuffer[i]
			}
			
			if (checksum !== this.receiveBuffer[frameLength - 2]) {
				this.receiveBuffer = this.receiveBuffer.slice(1)
				continue
			}
			
			// 提取命令和数据
			const cmd = this.receiveBuffer[2]
			const dataBytes = this.receiveBuffer.slice(3, frameLength - 2)
			
			console.log('解析到数据帧 - 命令:', cmd, '数据:', this.bytesToHex(dataBytes))
			
			// 通知数据监听者
			this.notifyDataListeners(cmd, dataBytes)
			
			// 移除已处理的帧
			this.receiveBuffer = this.receiveBuffer.slice(frameLength)
		}
	}
	
	notifyDataListeners(cmd, data) {
		this.dataListeners.forEach(listener => {
			try {
				listener(cmd, data)
			} catch (e) {
				console.error('数据监听者执行失败:', e)
			}
		})
	}
	
	addDataListener(listener) {
		this.dataListeners.push(listener)
	}
	
	removeDataListener(listener) {
		this.dataListeners = this.dataListeners.filter(l => l !== listener)
	}
	
	parseFloatFromBytes(bytes) {
		if (bytes.length < 4) return 0
		const buffer = new ArrayBuffer(4)
		const view = new DataView(buffer)
		for (let i = 0; i < 4; i++) {
			view.setUint8(i, bytes[i])
		}
		return view.getFloat32(0, true) // 小端序
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
			autoMove: 0x09,
			queryStatus: 0x0A
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
		this.receiveBuffer = []
		this.notifyListeners()
	}
}

const bluetoothManager = new BluetoothManager()

export default bluetoothManager