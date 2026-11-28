#!/usr/bin/env python3
"""Generate the three downloadable DDA learning tools.

The generated files are committed under dist/resources/downloads because the
static application serves versioned assets directly. Edit the content below and
rerun this script to regenerate the PDFs/XLSX; no backend or payment code is
involved.
"""
from pathlib import Path
from datetime import date
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, KeepTogether, Flowable,
)
from openpyxl import Workbook
from openpyxl.formatting.rule import FormulaRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table as ExcelTable, TableStyleInfo
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "dist/resources/downloads"
OUT.mkdir(parents=True, exist_ok=True)

NAVY = colors.HexColor("#081A2D")
NAVY_2 = colors.HexColor("#102A43")
GOLD = colors.HexColor("#D9A441")
GOLD_PALE = colors.HexColor("#F5E7C4")
CYAN = colors.HexColor("#62C7E8")
INK = colors.HexColor("#182536")
MUTED = colors.HexColor("#536579")
LINE = colors.HexColor("#D9E1E8")
PAPER = colors.HexColor("#FBFAF7")

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
pdfmetrics.registerFont(TTFont("DDA Sans", str(FONT_DIR / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DDA Sans Bold", str(FONT_DIR / "DejaVuSans-Bold.ttf")))

TODAY = date.today().isoformat()
VERSION = "Version 1.1 · novembre 2026"


def P(text, style):
    # Content is authored in this source file; keep the small ReportLab markup
    # used for labels such as <b>Définition.</b> and only convert line breaks.
    return Paragraph(text.replace("\n", "<br/>"), style)


def footer(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(NAVY)
    canvas.rect(0, h - 19 * mm, w, 19 * mm, stroke=0, fill=1)
    canvas.setFillColor(GOLD_PALE)
    canvas.setFont("DDA Sans Bold", 8)
    canvas.drawString(18 * mm, h - 11.5 * mm, "DARIUS DIGITAL ACADEMY")
    canvas.setFillColor(colors.white)
    canvas.setFont("DDA Sans", 7.5)
    canvas.drawRightString(w - 18 * mm, h - 11.5 * mm, doc.title.upper())
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 15 * mm, w - 18 * mm, 15 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("DDA Sans", 7)
    canvas.drawString(18 * mm, 9 * mm, VERSION)
    canvas.drawRightString(w - 18 * mm, 9 * mm, f"{doc.page}")
    canvas.restoreState()


def make_doc(path, title, top=25 * mm, bottom=23 * mm):
    doc = BaseDocTemplate(
        str(path), pagesize=A4, title=title, author="Darius Digital Academy",
        leftMargin=18 * mm, rightMargin=18 * mm, topMargin=top, bottomMargin=bottom,
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="dda", frames=frame, onPage=footer)])
    return doc


def styles():
    return {
        "kicker": ParagraphStyle("kicker", fontName="DDA Sans Bold", fontSize=8, leading=11, textColor=GOLD, spaceAfter=5, uppercase=True),
        "title": ParagraphStyle("title", fontName="DDA Sans Bold", fontSize=24, leading=28, textColor=NAVY, spaceAfter=8),
        "subtitle": ParagraphStyle("subtitle", fontName="DDA Sans", fontSize=10.5, leading=15, textColor=MUTED, spaceAfter=14),
        "h2": ParagraphStyle("h2", fontName="DDA Sans Bold", fontSize=13.5, leading=17, textColor=NAVY, spaceBefore=10, spaceAfter=6),
        "h3": ParagraphStyle("h3", fontName="DDA Sans Bold", fontSize=10, leading=13, textColor=NAVY, spaceAfter=3),
        "tablehead": ParagraphStyle("tablehead", fontName="DDA Sans Bold", fontSize=9, leading=12, textColor=colors.white, spaceAfter=0),
        "body": ParagraphStyle("body", fontName="DDA Sans", fontSize=8.7, leading=13, textColor=INK, spaceAfter=4),
        "small": ParagraphStyle("small", fontName="DDA Sans", fontSize=7.4, leading=10, textColor=MUTED),
        "term": ParagraphStyle("term", fontName="DDA Sans Bold", fontSize=10.2, leading=13, textColor=NAVY),
        "card": ParagraphStyle("card", fontName="DDA Sans", fontSize=7.6, leading=10.5, textColor=INK),
        "center": ParagraphStyle("center", fontName="DDA Sans", fontSize=8.5, leading=12, textColor=MUTED, alignment=TA_CENTER),
    }


def checklist_pdf():
    path = OUT / "checklist-avant-decision.pdf"
    s = styles()
    doc = make_doc(path, "Checklist avant une décision")
    story = [
        P("OUTIL DE PRATIQUE · DDA FREE", s["kicker"]),
        P("Checklist avant une décision", s["title"]),
        P("Une fiche imprimable pour ralentir, rendre ton scénario lisible et décider de façon cohérente avec ton cadre. Elle ne donne aucun signal et ne promet aucun résultat.", s["subtitle"]),
        Table([[P("COMMENT L'UTILISER", s["tablehead"]), P("RÈGLE DDA", s["tablehead"])], [P("Remplis-la avant d'agir, même lorsque tu penses que la situation est évidente. Si une réponse importante reste floue, l'option professionnelle peut être de ne pas agir.", s["card"]), P("Une décision se juge d'abord par la qualité du processus suivi, pas par son résultat immédiat.", s["card"])]], colWidths=[doc.width / 2] * 2, style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), NAVY), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BACKGROUND", (0, 1), (-1, 1), GOLD_PALE), ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ])),
        Spacer(1, 8),
        P("01 · CONTEXTE ET SCÉNARIO", s["h2"]),
    ]
    questions = [
        ("□", "Le contexte du marché est-il décrit en une phrase simple ?", "Contexte observé : ________________________________________________________________"),
        ("□", "Mon scénario est-il écrit avant toute décision ?", "Scénario envisagé : _______________________________________________________________"),
        ("□", "Quels éléments doivent confirmer ce scénario ?", "Confirmation attendue : ___________________________________________________________"),
        ("□", "Quelle condition invaliderait clairement mon idée ?", "Invalidation : ____________________________________________________________________"),
    ]
    for mark, q, line in questions:
        story.append(KeepTogether([Table([[P(f"<b>{mark}</b>  {q}", s["body"])], [P(line, s["small"])]], colWidths=[doc.width], style=TableStyle([("BOX", (0, 0), (-1, -1), 0.5, LINE), ("BACKGROUND", (0, 0), (-1, -1), colors.white), ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))]))
    story += [P("02 · RISQUE ET DISCIPLINE", s["h2"])]
    questions2 = [
        ("□", "Le risque est-il défini en termes simples, sans improvisation ?", "Cadre de risque / limite : _________________________________________________________"),
        ("□", "Suis-je en train de suivre un plan écrit plutôt qu'une impulsion ?", "Ce qui me le confirme : ____________________________________________________________"),
        ("□", "Mon état émotionnel permet-il une lecture patiente et lucide ?", "État du moment :  □ calme   □ pressé   □ hésitant   □ frustré   □ autre : ______________"),
        ("□", "Une condition justifie-t-elle de ne pas agir maintenant ?", "Si oui, laquelle ? _________________________________________________________________"),
    ]
    for mark, q, line in questions2:
        story.append(KeepTogether([Table([[P(f"<b>{mark}</b>  {q}", s["body"])], [P(line, s["small"])]], colWidths=[doc.width], style=TableStyle([("BOX", (0, 0), (-1, -1), 0.5, LINE), ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))]))
    story += [PageBreak(), P("03 · DÉCISION FINALE", s["kicker"]), P("Nommer l'action — ou la non-action", s["title"]), P("La décision finale doit être compréhensible par quelqu'un qui relirait cette fiche demain.", s["subtitle"])]
    decision = Table([
        [P("Je choisis :", s["h3"]), P("□ Observer   □ Attendre   □ Préparer   □ Renoncer   □ Autre : __________________", s["body"])],
        [P("Pourquoi maintenant ?", s["h3"]), P("________________________________________________________________________________<br/>________________________________________________________________________________", s["body"])],
        [P("Ce qui ferait changer d'avis :", s["h3"]), P("________________________________________________________________________________<br/>________________________________________________________________________________", s["body"])],
    ], colWidths=[48 * mm, doc.width - 48 * mm], style=TableStyle([("BOX", (0, 0), (-1, -1), 0.8, NAVY), ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE), ("BACKGROUND", (0, 0), (0, -1), GOLD_PALE), ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10)]))
    story += [decision, Spacer(1, 12), P("04 · NOTES DE RELECTURE", s["h2"]), P("Ce que je veux retenir de cette observation :", s["body"])]
    notes = Table([["\n\n\n\n\n\n\n"]], colWidths=[doc.width], rowHeights=[58 * mm], style=TableStyle([("BOX", (0, 0), (-1, -1), 0.7, LINE), ("BACKGROUND", (0, 0), (-1, -1), colors.white), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story += [notes, Spacer(1, 12), Table([[P("Date : ____________________", s["small"]), P("Marché / instrument : ____________________", s["small"]), P("Signature / initiales : ____________________", s["small"])]], colWidths=[doc.width / 3] * 3, style=TableStyle([("LINEABOVE", (0, 0), (-1, 0), 0.5, LINE), ("TOPPADDING", (0, 0), (-1, -1), 7)])), Spacer(1, 15), P("Cadre pédagogique DDA : cette fiche organise une réflexion et une pratique disciplinée. Elle ne constitue ni un conseil personnalisé, ni une recommandation d'achat ou de vente.", s["small"])]
    doc.build(story)


def glossary_pdf():
    path = OUT / "glossaire-marches.pdf"
    s = styles()
    doc = make_doc(path, "Glossaire des mots essentiels du marché")
    story = [P("REPÈRES DE FONDATION · DDA FREE", s["kicker"]), P("Les mots essentiels du marché", s["title"]), P("Un guide de référence court pour lire les premières leçons avec des définitions simples, des exemples de contexte et les erreurs à éviter.", s["subtitle"])]
    categories = [
        ("Fondamentaux du marché", [
            ("Actif", "Ce qui peut être échangé ou observé sur un marché.", "Une action, une paire de devises ou un indice sont des actifs différents.", "Un actif n'est pas automatiquement un bon ou un mauvais choix : il faut comprendre son contexte.", "Confondre le nom de l'actif avec une promesse de performance."),
            ("Marché", "Espace organisé où des participants confrontent des ordres et des prix.", "Le marché met en relation des intentions d'achat et de vente ; le prix observé résulte de cette rencontre.", "Le prix décrit une situation à un instant donné, pas une certitude sur la suite.", "Parler du marché comme s'il avait une direction garantie."),
            ("Participant", "Personne ou organisation qui intervient, observe ou fournit de la liquidité.", "Les objectifs et les horizons diffèrent selon les participants ; leurs actions ne se lisent pas toutes de la même façon.", "Toujours demander : qui agit, sur quel horizon, avec quelle contrainte ?", "Imaginer qu'un seul acteur explique chaque mouvement."),
        ]),
        ("Prix, cotation et liquidité", [
            ("Cotation", "Manière d'exprimer le prix d'un actif selon une convention donnée.", "EUR/USD indique combien d'unités de dollar sont nécessaires pour une unité d'euro.", "Vérifier l'unité et le sens de lecture avant de comparer deux prix.", "Lire une cotation à l'envers ou oublier l'unité."),
            ("Spread", "Écart entre le prix proposé à l'achat et celui proposé à la vente.", "Un spread plus large rend l'entrée et la sortie moins faciles à comparer au même instant.", "Le spread fait partie du contexte de lecture, pas d'un résultat garanti.", "Le traiter comme une commission identique sur tous les marchés."),
            ("Liquidité", "Facilité à échanger sans déplacer fortement le prix observé.", "Un marché très suivi peut généralement absorber davantage d'ordres qu'un marché peu échangé.", "La liquidité varie selon l'actif, l'heure et les conditions.", "Supposer qu'une liquidité habituelle reste constante."),
            ("Volatilité", "Amplitude et rythme des variations observées sur une période.", "Deux actifs peuvent changer de prix dans la même direction mais avec une amplitude différente.", "La volatilité décrit un comportement observé ; elle ne donne pas la direction future.", "Confondre volatilité et tendance."),
        ]),
        ("Ordres et gestion du risque", [
            ("Ordre", "Instruction formulée pour acheter ou vendre selon des conditions définies.", "Une instruction peut dépendre d'un prix, d'une confirmation ou d'une condition d'invalidation.", "Écrire l'idée avant l'action rend le processus vérifiable.", "Changer les règles après le mouvement par impatience."),
            ("Invalidation", "Condition prévue à l'avance qui rend une hypothèse incohérente.", "Si le scénario dépend d'une réaction sur une zone et que cette réaction n'existe pas, l'hypothèse doit être réévaluée.", "Une invalidation protège le raisonnement, pas un résultat financier.", "Déplacer l'invalidation pour ne pas reconnaître que l'idée a changé."),
            ("Risque", "Part d'incertitude et de perte potentielle à identifier et à encadrer avant d'agir.", "Le risque inclut le contexte, la décision, l'exécution possible et les conséquences d'une erreur.", "Si le risque n'est pas compréhensible, la décision n'est pas prête.", "Réduire le risque à un seul chiffre ou à une émotion."),
            ("Discipline", "Capacité à suivre un processus défini, y compris lorsque l'action la plus juste est d'attendre.", "Relire sa checklist et son Journal rend la discipline observable.", "La discipline se construit par des décisions répétées et documentées.", "La confondre avec le fait d'agir souvent."),
        ]),
        ("Lecture technique et position", [
            ("Support / résistance", "Zone où le prix a précédemment réagi ou ralenti, sans garantie de réaction future.", "Une zone est un repère de lecture à confronter au contexte, pas une ligne magique.", "Une zone demande confirmation et invalidation explicites.", "Traiter une zone comme une certitude."),
            ("Position", "Exposition ouverte ou hypothèse de travail suivie selon un cadre défini.", "Avant de parler de position, il faut pouvoir expliquer le scénario, le risque et ce qui l'invalide.", "La taille ou la durée ne remplace jamais un raisonnement clair.", "Prendre une position avant d'avoir défini le scénario."),
        ]),
    ]
    for idx, (category, terms) in enumerate(categories):
        story.append(P(category, s["h2"]))
        for term, definition, example, key, error in terms:
            body = Table([[P(term, s["term"])], [P(f"<b>Définition.</b> {definition}", s["card"])], [P(f"<b>Exemple.</b> {example}", s["card"])], [P(f"<b>À retenir.</b> {key}", s["card"])], [P(f"<b>Erreur fréquente.</b> {error}", s["card"])]], colWidths=[doc.width], style=TableStyle([("BOX", (0, 0), (-1, -1), 0.5, LINE), ("BACKGROUND", (0, 0), (-1, 0), GOLD_PALE), ("LEFTPADDING", (0, 0), (-1, -1), 9), ("RIGHTPADDING", (0, 0), (-1, -1), 9), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5)]))
            story += [KeepTogether([body]), Spacer(1, 5)]
        if idx == 1:
            story.append(PageBreak())
    story += [Spacer(1, 7), P("Ce glossaire est un support pédagogique. Les exemples décrivent des situations de lecture et ne constituent pas une recommandation d'investissement.", s["small"])]
    doc.build(story)


def style_cell(cell, fill=None, color="182536", bold=False, size=10, align="left"):
    cell.font = Font(name="Aptos", size=size, bold=bold, color="FFFFFF" if fill in ("081A2D", "102A43") else color)
    if fill:
        cell.fill = PatternFill("solid", fgColor=fill)
    cell.alignment = Alignment(horizontal=align, vertical="top", wrap_text=True)


def journal_xlsx():
    path = OUT / "journal-de-trading-template.xlsx"
    wb = Workbook()
    ws = wb.active
    ws.title = "Journal de trading"
    instructions = wb.create_sheet("Instructions")
    review = wb.create_sheet("Relecture")
    navy = "081A2D"; navy2 = "102A43"; gold = "D9A441"; pale = "F5E7C4"; cyan = "62C7E8"; soft = "F5F7FA"; line = "D9E1E8"
    thin = Side(style="thin", color=line)

    # Instructions sheet
    instructions.sheet_view.showGridLines = False
    instructions.merge_cells("A1:F1")
    instructions["A1"] = "DDA · Journal de trading"
    style_cell(instructions["A1"], fill=navy, bold=True, size=18)
    instructions.row_dimensions[1].height = 32
    instructions.merge_cells("A3:F3")
    instructions["A3"] = "Un modèle de relecture du processus — sans colonne de gain ou de perte chiffrée."
    style_cell(instructions["A3"], fill=pale, bold=True, size=11)
    guide = [
        ("1", "Une ligne = une observation ou une décision", "Remplis la ligne le plus près possible du moment observé. Le but est de conserver ton raisonnement, pas de réécrire l'histoire."),
        ("2", "Avant / pendant / après", "Décris d'abord le contexte et le scénario, puis le processus suivi et la décision. Termine par ce que tu as appris."),
        ("3", "Pas de performance inventée", "Le modèle ne demande aucun montant, rendement ou promesse. Il sert à rendre ta méthode et tes limites visibles."),
        ("4", "Utiliser la feuille Relecture", "Après plusieurs entrées, note les habitudes observées : patience, clarté du scénario, respect de l'invalidation et prochaine action."),
    ]
    instructions.append(["", "", "", "", "", ""])
    for i, (n, title, body) in enumerate(guide, start=5):
        instructions.cell(i, 1, n); style_cell(instructions.cell(i, 1), fill=gold, color=navy, bold=True, align="center")
        instructions.merge_cells(start_row=i, start_column=2, end_row=i, end_column=6)
        instructions.cell(i, 2, f"{title}\n{body}"); style_cell(instructions.cell(i, 2), fill=soft if i % 2 else "FFFFFF", size=10)
        instructions.row_dimensions[i].height = 42
    instructions["A11"] = "Champs conservés"
    style_cell(instructions["A11"], fill=navy2, bold=True)
    instructions.merge_cells("B11:F11"); instructions["B11"] = "Date · Marché ou instrument · Contexte (avant) · Scénario envisagé (avant) · Processus suivi (pendant) · Décision prise (pendant) · Résultat ou issue (après, sans chiffrer un gain ou une perte) · Ce qui a été bien fait · Ce qui doit être amélioré · Note personnelle"
    style_cell(instructions["B11"], fill=soft, size=9)
    instructions.row_dimensions[11].height = 48
    for col, width in zip("ABCDEF", [8, 28, 28, 18, 18, 18]): instructions.column_dimensions[col].width = width

    # Journal sheet
    ws.sheet_view.showGridLines = False
    ws.merge_cells("A1:J1"); ws["A1"] = "DDA · Journal de trading — modèle professionnel"
    style_cell(ws["A1"], fill=navy, bold=True, size=16); ws.row_dimensions[1].height = 30
    ws.merge_cells("A2:J2"); ws["A2"] = "Complète une ligne par observation. Les champs reprennent le Journal DDA en ligne et ne mesurent pas un gain ou une perte."
    style_cell(ws["A2"], fill=pale, bold=True, size=9); ws.row_dimensions[2].height = 28
    headers = ["Date", "Marché ou instrument", "Contexte (avant)", "Scénario envisagé (avant)", "Processus suivi (pendant)", "Décision prise (pendant)", "Résultat ou issue (après, sans chiffrer un gain ou une perte)", "Ce qui a été bien fait", "Ce qui doit être amélioré", "Note personnelle"]
    for c, h in enumerate(headers, 1):
        cell = ws.cell(4, c, h); style_cell(cell, fill=navy2, bold=True, size=9, align="center"); cell.border = Border(bottom=Side(style="medium", color=gold))
    example = ["2026-11-14", "EUR/USD", "Range serré observé, contexte encore peu lisible.", "Attendre une confirmation avant de prendre une décision.", "Checklist DDA relue avant toute action.", "Attendre", "Aucune action ; l'observation reste cohérente avec le scénario.", "Patience et invalidation écrite.", "Décrire plus précisément la zone observée.", "Ligne d'exemple — remplace-la par ta propre observation."]
    for r in range(5, 25):
        vals = example if r == 5 else [""] * 10
        for c, value in enumerate(vals, 1):
            cell = ws.cell(r, c, value); style_cell(cell, fill="FFF9E8" if r == 5 else ("FFFFFF" if r % 2 else soft), size=9); cell.border = Border(bottom=thin); cell.alignment = Alignment(vertical="top", wrap_text=True)
        ws.row_dimensions[r].height = 54 if r == 5 else 42
    ws.freeze_panes = "A5"
    ws.auto_filter.ref = "A4:J24"
    tab = ExcelTable(displayName="JournalDDA", ref="A4:J24")
    tab.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showFirstColumn=False, showLastColumn=False, showRowStripes=True, showColumnStripes=False)
    ws.add_table(tab)
    widths = [14, 20, 32, 34, 32, 23, 38, 30, 30, 30]
    for c, width in enumerate(widths, 1): ws.column_dimensions[get_column_letter(c)].width = width
    market_dv = DataValidation(type="list", formula1='"BRVM,EUR/USD,OR/XAUUSD,Bitcoin,Autre"', allow_blank=True); market_dv.promptTitle = "Marché"; market_dv.prompt = "Choisis un repère ou écris Autre."; ws.add_data_validation(market_dv); market_dv.add("B5:B24")
    decision_dv = DataValidation(type="list", formula1='"Observer,Attendre,Préparer,Renoncer,Autre"', allow_blank=True); decision_dv.promptTitle = "Décision"; decision_dv.prompt = "La non-action est une décision valable."; ws.add_data_validation(decision_dv); decision_dv.add("F5:F24")
    ws.conditional_formatting.add("F5:F24", FormulaRule(formula=['$F5="Renoncer"'], fill=PatternFill("solid", fgColor="E6F4F1")))

    # Review sheet
    review.sheet_view.showGridLines = False
    review.merge_cells("A1:F1"); review["A1"] = "DDA · Relecture comportementale et pédagogique"
    style_cell(review["A1"], fill=navy, bold=True, size=16); review.row_dimensions[1].height = 30
    review.merge_cells("A2:F2"); review["A2"] = "À remplir après plusieurs entrées : cherche des habitudes de processus, pas une note de performance."
    style_cell(review["A2"], fill=pale, bold=True, size=9)
    prompts = [
        ("Période relue", "Du ____________________ au ____________________"),
        ("Ce qui revient souvent dans mon contexte", "________________________________________________________________________________"),
        ("Mon scénario est-il généralement écrit avant la décision ?", "□ Toujours   □ Souvent   □ Parfois   □ Rarement"),
        ("Est-ce que je respecte mes invalidations ?", "□ Toujours   □ Souvent   □ Parfois   □ Rarement"),
        ("Ce qui a été bien fait", "________________________________________________________________________________\n________________________________________________________________________________"),
        ("Ce qui doit être amélioré", "________________________________________________________________________________\n________________________________________________________________________________"),
        ("Ma prochaine action d'apprentissage", "________________________________________________________________________________"),
    ]
    for r, (label, prompt) in enumerate(prompts, start=4):
        review.cell(r, 1, label); style_cell(review.cell(r, 1), fill=navy2, bold=True, size=9)
        review.merge_cells(start_row=r, start_column=2, end_row=r, end_column=6)
        review.cell(r, 2, prompt); style_cell(review.cell(r, 2), fill="FFFFFF" if r % 2 else soft, size=10)
        review.row_dimensions[r].height = 34 if "\n" not in prompt else 54
    for col, width in zip("ABCDEF", [36, 24, 24, 20, 20, 20]): review.column_dimensions[col].width = width
    review.freeze_panes = "B4"
    for sheet in wb.worksheets:
        sheet.sheet_properties.pageSetUpPr.fitToPage = True
        sheet.page_setup.fitToWidth = 1
        sheet.page_setup.fitToHeight = 0
        sheet.page_setup.paperSize = sheet.PAPERSIZE_A4
        sheet.oddFooter.center.text = "Darius Digital Academy · Outil pédagogique"
        sheet.oddFooter.right.text = "Page &P / &N"
    ws.page_setup.orientation = "landscape"
    ws.print_title_rows = "1:4"
    wb.save(path)


if __name__ == "__main__":
    checklist_pdf()
    glossary_pdf()
    journal_xlsx()
    print(f"Generated resources in {OUT}")
