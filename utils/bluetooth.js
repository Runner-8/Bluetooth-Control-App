class BluetoothManager {
	constructor() {
		this.connectedDevice = null
		this.socket = null
		this.isConnected = false
		this.listeners = []
		this.connectionType = null
		this.sendQueue = [] // 发送队列
		this.isSending = false // 是否正在发送
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
	
	// 发送数据（添加结束符和发送间隔）
	sendData(data) {
		return new Promise((resolve, reject) => {
			if (!this.connectedDevice) {
				reject(new Error('未连接设备'))
				return
			}
			
			// 添加换行符作为结束符
			const dataWithEnd = data + '\n'
			
			// 添加到发送队列
			this.sendQueue.push({ data: dataWithEnd, resolve, reject })
			
			// 如果不在发送中，开始处理队列
			if (!this.isSending) {
				this.processQueue()
			}
		})
	}
	
	// 处理发送队列
	async processQueue() {
		if (this.sendQueue.length === 0) {
			this.isSending = false
			return
		}
		
		this.isSending = true
		const item = this.sendQueue.shift()
		
		try {
			await this.sendSingleData(item.data)
			console.log('发送成功:', item.data.trim())
			item.resolve()
		} catch (err) {
			console.error('发送失败:', err)
			item.reject(err)
		}
		
		// 发送间隔50ms，防止数据粘包
		setTimeout(() => {
			this.processQueue()
		}, 50)
	}
	
	// 发送单条数据
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