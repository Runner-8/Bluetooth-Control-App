
class BluetoothManager {
	constructor() {
		this.connectedDevice = null
		this.socket = null
		this.isConnected = false
		this.listeners = []
		this.connectionType = null
		this.sendQueue = []
		this.isSending = false
	}
	
	setConnectedDevice(device, type = 'classic') {
		this.connectedDevice = device
		this.isConnected = device !== null
		this.connectionType = type
		this.notifyListeners()
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
	
	sendData(data) {
		return new Promise((resolve, reject) => {
			if (!this.connectedDevice) {
				reject(new Error('未连接设备'))
				return
			}
			
			// 确保数据是 ArrayBuffer
			let sendData = data
			if (!(data instanceof ArrayBuffer)) {
				// 如果是字符串，转换为 ArrayBuffer
				if (typeof data === 'string') {
					const buffer = new ArrayBuffer(data.length)
					const view = new DataView(buffer)
					for (let i = 0; i < data.length; i++) {
						view.setUint8(i, data.charCodeAt(i))
					}
					sendData = buffer
				} else if (Array.isArray(data)) {
					// 如果是数组，转换为 ArrayBuffer
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
			queryStatus: 0x08
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
		}
		
		const frame = this.buildFrame(cmd, frameData)
		return this.sendData(frame)
	}
	
	disconnect() {
		return new Promise((resolve) => {
			this.sendQueue = []
			this.isSending = false
			
			if (this.connectionType === 'classic' && this.socket) {
				this.socket.close({
					success: () => { this.cleanup(); resolve() },
					fail: () => { this.cleanup(); resolve() }
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