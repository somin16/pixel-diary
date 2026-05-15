import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req: Request) => {
  // 웹훅(Webhook) URL
  const DISCORD_WEBHOOK_URL = Deno.env.get("DISCORD_WEBHOOK_URL");

  // 슈파베이스 관리자(Service Role) 클라이언트 생성
  // 이 키를 써야 보안 구역인 auth.users에 접근 가능
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // 주소가 없으면 여기서 바로 함수를 종료(return)
  if (!DISCORD_WEBHOOK_URL) {
    console.error("환경 변수 DISCORD_WEBHOOK_URL이 설정되지 않았습니다.");
    return new Response(
      JSON.stringify({ error: "Webhook URL is missing" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Supabase 데이터베이스에서 넘어온 데이터 꺼내기
    const payload = await req.json();
    const newContact = payload.record;

    // 만약 user_id가 없다면 종료
    if (!newContact?.user_id) {
      return new Response("User ID is missing in record", { status: 400 });
    }

    // users 테이블에서 '이름' 가져오기
    const { data: userData, error: userError } = await supabase
      .from("users") 
      .select("user_name")
      .eq("id", newContact.user_id)
      .single();

    if (userError) console.error("이름 조회 실패:", userError.message);

    // Auth 시스템에서 '이메일' 직접 가져오기
    // getUserById는 관리자 권한이 있어야만 작동
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(
      newContact.user_id
    );

    if (authError) console.error("이메일 조회 실패:", authError.message);

    // 데이터가 없을 경우를 대비한 기본값 설정
    const userName = userData?.user_name || "이름 정보 없음";
    const userEmail = authUser?.user?.email || "이메일 정보 없음";

    // 디스코드에 띄울 메시지
    const discordMessage = {
      embeds: [{
        title: "📩 새로운 문의가 접수되었습니다",
        color: 0x5865F2,
        fields: [
          { name: "👤 작성자", value: userName, inline: true },
          { name: "🆔 유저 ID", value: `\`${newContact.user_id}\``, inline: false },
          { name: "📧 이메일", value: userEmail, inline: true },
          { name: "📝 문의 내용", value: newContact.message, inline: false }
        ],
        footer: { text: "Pixel Diary 관리 시스템" },
        timestamp: new Date().toISOString(),
      }]
    };

    // 디스코드 서버로 메시지를 전송
    await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordMessage),
    });

    return new Response(JSON.stringify({ message: "디스코드 알림 전송 성공" }), { 
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("에러 발생 원인:", error);
    return new Response(JSON.stringify({ error: "알림 전송 실패" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
})