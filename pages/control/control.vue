c:\uni-app_Project\test01_7_22\pages\control\control.vue
<template>
	<view class="container">
		<view class="status-bar">
			<text class="status-label">当前状态</text>
			<text class="status-value">{{ currentStatus }}</text>
		</view>
		
		<view class="control-panel">
			<view class="left-panel">
				<view class="control-btn btn-up" @touchstart="startMove('up')" @touchend="stopMove">
					<text class="btn-icon">↑</text>
					<text class="btn-text">前进</text>
				</view>
				<view class="control-btn btn-down" @touchstart="startMove('down')" @touchend="stopMove">
					<text class="btn-icon">↓</text>
					<text class="btn-text">后退</text>
				</view>
			</view>
			
			<view class="right-panel">
				<view class="control-btn btn-left" @touchstart="startMove('left')" @touchend="stopMove">
					<text class="btn-icon">←</text>
					<text class="btn-text">左转</text>
				</view>
				<view class="control-btn btn-right" @touchstart="startMove('right')" @touchend="stopMove">
					<text class="btn-icon">→</text>
					<text class="btn-text">右转</text>
				</view>
			</view>
		</view>
		
		<view class="tips">
			<text class="tips-text">按住按钮控制小车移动</text>
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
		display: flex;
		flex-direction: column;
		padding: 30rpx;
		padding-top: calc(env(safe-area-inset-top) + 30rpx);
		box-sizing: border-box;
	}
	
	.status-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255,255,255,0.1);
		border-radius: 20rpx;
		padding: 30rpx 40rpx;
		margin-bottom: 60rpx;
	}
	
	.status-label {
		font-size: 32rpx;
		color: rgba(255,255,255,0.7);
		font-weight: 600;
	}
	
	.status-value {
		font-size: 48rpx;
		color: #fff;
		font-weight: bold;
	}
	
	.control-panel {
		flex: 1;
		display: flex;
		justify-content: space-between;
		padding: 0 20rpx;
	}
	
	.left-panel, .right-panel {
		display: flex;
		flex-direction: column;
		gap: 40rpx;
	}
	
	.control-btn {
		width: 180rpx;
		height: 180rpx;
		border-radius: 24rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.3);
		
		&:active {
			transform: scale(0.95);
			opacity: 0.8;
		}
	}
	
	.btn-up {
		background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
	}
	
	.btn-down {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	}
	
	.btn-left {
		background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
	}
	
	.btn-right {
		background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
	}
	
	.btn-icon {
		font-size: 56rpx;
		color: #fff;
		margin-bottom: 8rpx;
	}
	
	.btn-text {
		font-size: 28rpx;
		color: #fff;
		font-weight: 600;
	}
	
	.tips {
		text-align: center;
		padding: 30rpx 0;
	}
	
	.tips-text {
		font-size: 26rpx;
		color: rgba(255,255,255,0.5);
	}
</style>
