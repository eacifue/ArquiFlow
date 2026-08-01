using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace ArquiFlow.Api.Features.Reports;

public class ProjectReportDocument(ProjectReportData data) : IDocument
{
    private static readonly string BrandColor = Colors.Blue.Darken2;
    private static readonly string CriticalColor = Colors.Red.Medium;
    private static readonly string MutedColor = Colors.Grey.Darken1;

    private static readonly Dictionary<string, string> ProjectStatusLabel = new()
    {
        ["Planning"] = "Planificación",
        ["InProgress"] = "En curso",
        ["OnHold"] = "En pausa",
        ["Completed"] = "Completada",
        ["Cancelled"] = "Cancelada",
    };

    private static readonly Dictionary<string, string> TaskStatusLabel = new()
    {
        ["NotStarted"] = "No iniciada",
        ["InProgress"] = "En curso",
        ["Done"] = "Hecha",
        ["Delayed"] = "Atrasada",
    };

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(32);
            page.DefaultTextStyle(x => x.FontSize(10).FontColor(Colors.Black));

            page.Header().Element(ComposeHeader);
            page.Content().PaddingTop(15).Column(column =>
            {
                column.Spacing(16);
                column.Item().Element(ComposeBudgetSection);
                column.Item().Element(ComposeScheduleSection);
                if (data.RecentPhotos.Count > 0)
                {
                    column.Item().Element(ComposePhotosSection);
                }
            });

            page.Footer().AlignCenter().DefaultTextStyle(x => x.FontSize(8).FontColor(MutedColor)).Text(text =>
            {
                text.Span("Generado por ArquiFlow el ");
                text.Span(DateTime.Now.ToString("dd/MM/yyyy HH:mm"));
                text.Span(" — Página ");
                text.CurrentPageNumber();
                text.Span(" de ");
                text.TotalPages();
            });
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().Text("ArquiFlow").FontSize(9).FontColor(MutedColor).Bold();
            column.Item().PaddingTop(2).Text(data.ProjectName).FontSize(20).Bold();

            column.Item().PaddingTop(4).Row(row =>
            {
                row.RelativeItem().Text(text =>
                {
                    if (!string.IsNullOrWhiteSpace(data.Address))
                    {
                        text.Span(data.Address).FontColor(MutedColor);
                    }
                });
                row.RelativeItem().AlignRight().Text(text =>
                {
                    text.Span("Estado: ").FontColor(MutedColor);
                    text.Span(ProjectStatusLabel.GetValueOrDefault(data.Status, data.Status)).Bold();
                });
            });

            if (data.StartDate is not null || data.EndDate is not null)
            {
                column.Item().PaddingTop(2).Text(text =>
                {
                    text.Span("Período: ").FontColor(MutedColor);
                    text.Span($"{data.StartDate?.ToString("dd/MM/yyyy") ?? "—"} a {data.EndDate?.ToString("dd/MM/yyyy") ?? "—"}");
                });
            }

            column.Item().PaddingTop(10).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
        });
    }

    private void ComposeBudgetSection(IContainer container)
    {
        var totalBudgeted = data.BudgetItems.Sum(b => b.Budgeted);
        var totalSpent = data.BudgetItems.Sum(b => b.Spent);

        container.Column(column =>
        {
            column.Item().Text("Presupuesto vs. gasto real").FontSize(14).Bold().FontColor(BrandColor);

            column.Item().PaddingTop(6).Row(row =>
            {
                row.RelativeItem().Text(text =>
                {
                    text.Span("Presupuestado: ").FontColor(MutedColor);
                    text.Span(FormatCurrency(totalBudgeted)).Bold();
                });
                row.RelativeItem().Text(text =>
                {
                    text.Span("Gastado: ").FontColor(MutedColor);
                    text.Span(FormatCurrency(totalSpent)).Bold().FontColor(totalSpent > totalBudgeted ? CriticalColor : Colors.Black);
                });
            });

            if (data.BudgetItems.Count == 0)
            {
                column.Item().PaddingTop(8).Text("Sin ítems de presupuesto cargados.").FontColor(MutedColor).Italic();
                return;
            }

            column.Item().PaddingTop(10).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(2);
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderCell).Text("Categoría");
                    header.Cell().Element(HeaderCell).Text("Descripción");
                    header.Cell().Element(HeaderCell).AlignRight().Text("Presupuestado");
                    header.Cell().Element(HeaderCell).AlignRight().Text("Gastado");
                });

                foreach (var item in data.BudgetItems)
                {
                    var overBudget = item.Spent > item.Budgeted;
                    table.Cell().Element(BodyCell).Text(item.Category);
                    table.Cell().Element(BodyCell).Text(item.Description);
                    table.Cell().Element(BodyCell).AlignRight().Text(FormatCurrency(item.Budgeted));
                    var spentSpan = table.Cell().Element(BodyCell).AlignRight()
                        .Text(FormatCurrency(item.Spent)).FontColor(overBudget ? CriticalColor : Colors.Black);
                    if (overBudget)
                    {
                        spentSpan.Bold();
                    }
                }
            });
        });
    }

    private void ComposeScheduleSection(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().Text("Cronograma").FontSize(14).Bold().FontColor(BrandColor);

            if (data.ScheduleTasks.Count == 0)
            {
                column.Item().PaddingTop(8).Text("Sin tareas de cronograma cargadas.").FontColor(MutedColor).Italic();
                return;
            }

            column.Item().PaddingTop(10).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(3);
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(2);
                    columns.RelativeColumn(1);
                    columns.RelativeColumn(2);
                });

                table.Header(header =>
                {
                    header.Cell().Element(HeaderCell).Text("Tarea");
                    header.Cell().Element(HeaderCell).Text("Inicio");
                    header.Cell().Element(HeaderCell).Text("Fin");
                    header.Cell().Element(HeaderCell).AlignRight().Text("Avance");
                    header.Cell().Element(HeaderCell).Text("Estado");
                });

                foreach (var task in data.ScheduleTasks)
                {
                    var isDelayed = task.Status == "Delayed";
                    table.Cell().Element(BodyCell).Text(task.Name);
                    table.Cell().Element(BodyCell).Text(task.StartDate.ToString("dd/MM/yyyy"));
                    table.Cell().Element(BodyCell).Text(task.EndDate.ToString("dd/MM/yyyy"));
                    table.Cell().Element(BodyCell).AlignRight().Text($"{task.ProgressPercent}%");
                    var statusSpan = table.Cell().Element(BodyCell)
                        .Text(TaskStatusLabel.GetValueOrDefault(task.Status, task.Status))
                        .FontColor(isDelayed ? CriticalColor : Colors.Black);
                    if (isDelayed)
                    {
                        statusSpan.Bold();
                    }
                }
            });
        });
    }

    private void ComposePhotosSection(IContainer container)
    {
        container.Column(column =>
        {
            column.Item().Text("Avance fotográfico reciente").FontSize(14).Bold().FontColor(BrandColor);

            column.Item().PaddingTop(10).Row(row =>
            {
                foreach (var photo in data.RecentPhotos)
                {
                    row.RelativeItem().Padding(4).Column(photoColumn =>
                    {
                        photoColumn.Item().Height(110).Image(photo.PhysicalFilePath).FitArea();
                        photoColumn.Item().PaddingTop(2).AlignCenter()
                            .Text(photo.Date.ToString("dd/MM/yyyy")).FontSize(8).FontColor(MutedColor);
                    });
                }
            });
        });
    }

    private static IContainer HeaderCell(IContainer container) =>
        container.DefaultTextStyle(x => x.Bold().FontColor(Colors.White)).Background(BrandColor).Padding(5);

    private static IContainer BodyCell(IContainer container) =>
        container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).Padding(5);

    private static string FormatCurrency(decimal amount) => $"${amount:N0}";
}
