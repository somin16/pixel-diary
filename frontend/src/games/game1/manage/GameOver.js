// 게임 종료
export function gameOver(scene) {

	// 게임 종료 true
	scene.gameEnd = true;

	// 연속작동 방지를 위해 isDead를 true로 변경
	scene.player.isDead = true;

	// 게임정지
	scene.physics.pause();
	scene.time.paused = true;

	// 조이스틱 파괴(단순 가시성을 위한것입니다)
	scene.joystick.destroy();

	// UI 그룹 및 위치조정
	scene.gameOverUI = scene.add.container(0, 0);
	scene.gameOverUI.setScrollFactor(0);
	scene.gameOverUI.setDepth(500);

	// 현재 화면의 가로 세로 크기 받기
	const { width, height } = scene.cameras.main;

	// 가로세로 중앙
	const centerX = width / 2;
	const centerY = height / 2;

	// 반투명 검은배경을 게임 전체에 깔기
	const backGround = scene.add.rectangle(
	centerX,
	centerY,
	scene.cameras.main.width,
	scene.cameras.main.height,
	0x000000,
	0.7
	);

	// 게임오버 텍스트
	const gameOverText = scene.add.text(centerX, height * 0.25, "GAME OVER", {
	fontFamily: "Mona",
	fontSize: "48px",
	fontStyle: "bold",
	fill: "#ff4444"
	}).setOrigin(0.5);

	// 두 버튼이 가로 화면 안에 들어오도록 세로 비율로 배치
	const restartButtonPosY = height * 0.5;
	const returnHomeButtonPosY = height * 0.75;

	// 재시작 버튼 배경
	const restartButtonBackground = scene.add.rectangle(centerX, restartButtonPosY, 250, 60, 0x44aa44)
	.setScrollFactor(0) // 이거 안하면 이상한곳에서 스폰돼서 클릭이 안된다
	.setInteractive()   // 이걸 넣어줘야 클릭이 가능
	.on('pointerdown', () => { // 누를때 작동

		scene.gameEnd = false;
		scene.scene.start('ModeSelectScene'); // 생각해보니까 모드 선택 화면으로 보내는게 맞을거같아서 모드 선택화면으로 이동하는걸로 변경했습니다
	});

	// 재시작 버튼 뒷배경
	const restartButtonDetail = scene.add.rectangle(
		restartButtonBackground.x, restartButtonBackground.y + 10,
		restartButtonBackground.width + 8, restartButtonBackground.height, 0x2d732d
	).setScrollFactor(0);

	// 재시작 버튼 텍스트
	const restartButtonText = scene.add.text(centerX, restartButtonPosY, "다시 도전하기!", {
	fontFamily: "Mona",
	fontSize: "24px",
	fontStyle: "bold",
	fill: "#ffffff"
	}).setOrigin(0.5);

	// 메인 화면으로 돌아가기
	const returnHomeButton = scene.add.rectangle(centerX, returnHomeButtonPosY, 250, 60, 0xb85c64)
	.setScrollFactor(0)
	.setInteractive()
	.on('pointerdown', () => {
		window.dispatchEvent(new CustomEvent("exitMiniGame"));
	});

	const returnHomeButtonDetail = scene.add.rectangle(
		returnHomeButton.x, returnHomeButton.y + 10,
		returnHomeButton.width + 8, returnHomeButton.height, 0x803f48
	).setScrollFactor(0);

	const returnHomeButtonText = scene.add.text(centerX, returnHomeButtonPosY, "메인 화면으로 이동!", {
		fontFamily: "Mona",
		fontSize: "24px",
		fontStyle: "bold",
		fill: "#ffffff"
	}).setOrigin(0.5);

	// 뒷배경 → 버튼 → 텍스트 순서로 넣어 겹침 순서를 유지
	scene.gameOverUI.add([
		backGround, gameOverText,
		restartButtonDetail, restartButtonBackground, restartButtonText,
		returnHomeButtonDetail, returnHomeButton, returnHomeButtonText
	]);
}
