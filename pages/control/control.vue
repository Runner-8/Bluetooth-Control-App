c:\uni-app_Project\test01_7_22\pages\control\control.vue
<template>
	<view class="container">
		<view class="nav-bar">
			<view class="back-btn" @click="goBack">
				<text class="back-icon">←</text>
			</view>
			<text class="nav-title">小车控制</text>
			<view class="placeholder"></view>
		</view>
		
		<view class="control-panel">
			<view class="control-area">
				<view class="btn-up" @touchstart="startMove('up')" @touchend="stopMove">
					<text class="btn-icon">↑</text>
					<text class="btn-text">前进</text>
				</view>
				
				<view class="btn-row">
					<view class="btn-left" @touchstart="startMove('left')" @touchend="stopMove">
						<text class="btn-icon">←</text>
						<text class="btn-text">左转</text>
					</view>
					
					<view class="btn-stop" @click="stopMove">
						<text class="btn-icon">■</text>
						<text class="btn-text">停止</text>
					</view>
					
					<view class="btn-right" @touchstart="startMove('right')" @touchend="stopMove">
						<text class="btn-icon">→</text>
						<text class="btn-text">右转</text>
					</view>
				</view>
				
				<view class="btn-down" @touchstart="startMove('down')" @touchend="stopMove">
					<text class="btn-icon">↓</text>
					<text class="btn-text">后退</text>
				</view>
			</view>
			
			<view class="status-info">
				<text class="status-label">当前状态</text>
				<text class="status-value">{{ currentStatus }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				currentStatus: '停止',
				movingDirection: ''
			}
		},
		onLoad() {
			
		},
		methods: {
			goBack() {
				uni.navigateBack()
			},
			
			startMove(direction) {
				this.movingDirection = direction
				const directionMap = {
					up: '前进',
					down: '后退',
					left: '左转',
					right: '右转'
				}
				this.currentStatus = directionMap[direction]
				this.sendCommand(direction)
			},
			
			stopMove() {
				this.movingDirection = ''
				this.currentStatus = '停止'
				this.sendCommand('stop')
			},
			
			sendCommand(command) {
				console.log('发送命令:', command)
			}
		}
	}
</script>

<style lang="scss">
	.container {
		min-height: 100vh;
		background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
	}
	
	.nav-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 30rpx 40rpx;
		background: rgba(0,0,0,0.3);
	}
	
	.back-btn {
		width: 80rpx;
		height: 80rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255,255,255,0.1);
		border-radius: 50%;
	}
	
	.back-icon {
		font-size: 40rpx;
		color: #fff;
	}
	
	.nav-title {
		font-size: 36rpx;
		font-weight: bold;
		color: #fff;
	}
	
	.placeholder {
		width: 80rpx;
	}
	
	.control-panel {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 60rpx;
		height: calc(100vh - 140rpx);
		box-sizing: border-box;
	}
	
	.control-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 30rpx;
		margin-bottom: 60rpx;
	}
	
	.btn-up, .btn-down, .btn-left, .btn-right, .btn-stop {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border-radius: 24rpx;
		transition: all 0.2s ease;
	}
	
	.btn-up, .btn-down {
		width: 180rpx;
		height: 180rpx;
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}
	
	.btn-left, .btn-right {
		width: 160rpx;
		height: 160rpx;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.btn-stop {
		width: 140rpx;
		height: 140rpx;
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	}
	
	.btn-row {
		display: flex;
		gap: 40rpx;
		align-items: center;
	}
	
	.btn-icon {
		font-size: 48rpx;
		margin-bottom: 10rpx;
		color: #fff;
	}
	
	.btn-text {
		font-size: 24rpx;
		color: #fff;
		font-weight: 600;
	}
	
	.btn-up:active, .btn-down:active, .btn-left:active, .btn-right:active, .btn-stop:active {
		transform: scale(0.9);
		opacity: 0.8;
	}
	
	.status-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		background: rgba(255,255,255,0.1);
		border-radius: 20rpx;
		padding: 40rpx 80rpx;
	}
	
	.status-label {
		font-size: 28rpx;
		color: rgba(255,255,255,0.6);
		margin-bottom: 15rpx;
	}
	
	.status-value {
		font-size: 48rpx;
		color: #fff;
		font-weight: bold;
	}
</style>