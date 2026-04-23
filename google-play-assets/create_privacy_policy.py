#!/usr/bin/env python3
"""
Generate Privacy Policy PDF for Treasure Hunt app
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY

# Colors
DARK_BLUE = HexColor("#1A365D")
GOLD = HexColor("#D4A017")
GRAY = HexColor("#666666")


def create_privacy_policy():
    doc = SimpleDocTemplate(
        "/Users/jenkins3/treasure-hunt/google-play-assets/privacy_policy.pdf",
        pagesize=A4,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Heading1"],
        fontSize=24,
        textColor=DARK_BLUE,
        alignment=TA_CENTER,
        spaceAfter=30,
        fontName="Helvetica-Bold",
    )

    subtitle_style = ParagraphStyle(
        "Subtitle",
        parent=styles["Normal"],
        fontSize=12,
        textColor=GRAY,
        alignment=TA_CENTER,
        spaceAfter=20,
    )

    section_style = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=DARK_BLUE,
        spaceBefore=20,
        spaceAfter=10,
        fontName="Helvetica-Bold",
    )

    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=10,
        leading=16,
        alignment=TA_JUSTIFY,
        spaceAfter=10,
    )

    story = []

    story.append(Paragraph("隐私政策", title_style))
    story.append(Paragraph("寻宝记 Treasure Hunt", subtitle_style))
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=2, color=GOLD))
    story.append(Spacer(1, 30))
    story.append(Paragraph("最后更新日期: 2024年1月15日", subtitle_style))
    story.append(Spacer(1, 30))

    story.append(Paragraph("一、信息收集", section_style))
    story.append(
        Paragraph(
            '寻宝记（"我们"、"我们的"或"应用"）非常重视您的隐私。本隐私政策解释了当您使用我们的移动应用程序时，我们如何收集、使用、披露和保护您的信息。',
            body_style,
        )
    )
    story.append(
        Paragraph(
            "通过下载和使用寻宝记，您同意按照本隐私政策收集和使用信息。如果您不同意本政策的任何条款，请不要使用本应用。",
            body_style,
        )
    )

    story.append(Paragraph("二、我们收集的信息", section_style))
    story.append(Paragraph("<b>1. 您主动提供的信息</b>", body_style))
    story.append(
        Paragraph(
            "账户信息：当您注册账户时，我们会收集您的邮箱、用户名和头像", body_style
        )
    )
    story.append(Paragraph("社交功能：您的好友列表、聊天记录和交易记录", body_style))
    story.append(Paragraph("您主动提交的反馈、评价或咨询", body_style))

    story.append(Paragraph("<b>2. 使用时自动收集的信息</b>", body_style))
    story.append(Paragraph("设备信息：设备型号、操作系统版本、屏幕分辨率", body_style))
    story.append(
        Paragraph("位置信息：精确或模糊的GPS位置（用于显示附近宝藏）", body_style)
    )
    story.append(
        Paragraph("使用数据：您与应用的交互、收藏的物品、游戏进度", body_style)
    )
    story.append(Paragraph("日志数据：崩溃报告、性能数据、点击流分析", body_style))

    story.append(Paragraph("三、信息使用方式", section_style))
    story.append(Paragraph("我们使用收集的信息用于：", body_style))
    story.append(Paragraph("提供和改进游戏服务", body_style))
    story.append(Paragraph("个性化您的游戏体验", body_style))
    story.append(Paragraph("显示您附近的宝藏位置", body_style))
    story.append(Paragraph("发送游戏通知和活动提醒", body_style))
    story.append(Paragraph("防止欺诈和保障安全", body_style))
    story.append(Paragraph("遵守法律法规", body_style))

    story.append(Paragraph("四、信息共享", section_style))
    story.append(
        Paragraph(
            "我们不会出售您的个人信息。我们可能与以下第三方共享信息：", body_style
        )
    )
    story.append(Paragraph("服务提供商：帮助我们运营游戏的合作伙伴", body_style))
    story.append(Paragraph("法律要求：法院命令或政府要求时", body_style))
    story.append(Paragraph("您的同意：在您明确同意的情况下", body_style))

    story.append(Paragraph("五、数据安全", section_style))
    story.append(
        Paragraph(
            "我们采用行业标准的安全措施保护您的信息，包括数据加密、安全传输协议（SSL/TLS）和访问控制。我们定期审查和更新安全措施。",
            body_style,
        )
    )

    story.append(Paragraph("六、数据存储", section_style))
    story.append(
        Paragraph(
            "您的信息存储在安全的服务器上。账户注销后，我们会在合理期限内删除您的个人信息，法律法规另有规定的除外。",
            body_style,
        )
    )

    story.append(Paragraph("七、您的权利", section_style))
    story.append(Paragraph("根据您所在地区法律，您可能有权：", body_style))
    story.append(Paragraph("访问您的个人信息", body_style))
    story.append(Paragraph("更正不准确的信息", body_style))
    story.append(Paragraph("删除您的个人信息", body_style))
    story.append(Paragraph("撤回同意", body_style))
    story.append(Paragraph("数据可携带性", body_style))

    story.append(Paragraph("八、儿童隐私", section_style))
    story.append(
        Paragraph(
            "我们的应用不面向13岁以下儿童（或其他适用年龄）。如果我们发现收集了儿童个人信息，我们会立即删除。",
            body_style,
        )
    )

    story.append(Paragraph("九、政策变更", section_style))
    story.append(
        Paragraph(
            "我们可能不时更新本隐私政策。重大变更会通过应用内通知或邮件通知您。继续使用应用即表示您接受更新后的政策。",
            body_style,
        )
    )

    story.append(Paragraph("十、联系我们", section_style))
    story.append(
        Paragraph("如果您对本隐私政策有任何疑问，请通过以下方式联系我们：", body_style)
    )
    story.append(Paragraph("邮箱: privacy@treasurehunt.example.com", body_style))
    story.append(Paragraph("应用内客服系统", body_style))

    story.append(Spacer(1, 40))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD))
    story.append(Spacer(1, 20))
    story.append(Paragraph("寻宝记 Treasure Hunt 版权所有", subtitle_style))

    doc.build(story)
    print("Privacy policy PDF created successfully!")


if __name__ == "__main__":
    create_privacy_policy()
