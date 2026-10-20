using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ArquiFlow.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class RedesignFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Suppliers_SupplierId",
                table: "Payments");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "SiteLogEntries",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            // Existing entries only have a day; place them at noon of that day.
            migrationBuilder.Sql(
                "UPDATE \"SiteLogEntries\" SET \"CreatedAt\" = (\"Date\" + time '12:00') AT TIME ZONE 'UTC';");

            migrationBuilder.AddColumn<Guid>(
                name: "ProjectManagerId",
                table: "Projects",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SupervisorId",
                table: "Projects",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "InvitedAt",
                table: "ProjectClientAccesses",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            migrationBuilder.AlterColumn<Guid>(
                name: "SupplierId",
                table: "Payments",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginAt",
                table: "AspNetUsers",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Projects_ProjectManagerId",
                table: "Projects",
                column: "ProjectManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_Projects_SupervisorId",
                table: "Projects",
                column: "SupervisorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Suppliers_SupplierId",
                table: "Payments",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_AspNetUsers_ProjectManagerId",
                table: "Projects",
                column: "ProjectManagerId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Projects_AspNetUsers_SupervisorId",
                table: "Projects",
                column: "SupervisorId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Payments_Suppliers_SupplierId",
                table: "Payments");

            migrationBuilder.DropForeignKey(
                name: "FK_Projects_AspNetUsers_ProjectManagerId",
                table: "Projects");

            migrationBuilder.DropForeignKey(
                name: "FK_Projects_AspNetUsers_SupervisorId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Projects_ProjectManagerId",
                table: "Projects");

            migrationBuilder.DropIndex(
                name: "IX_Projects_SupervisorId",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "SiteLogEntries");

            migrationBuilder.DropColumn(
                name: "ProjectManagerId",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "SupervisorId",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "InvitedAt",
                table: "ProjectClientAccesses");

            migrationBuilder.DropColumn(
                name: "LastLoginAt",
                table: "AspNetUsers");

            migrationBuilder.AlterColumn<Guid>(
                name: "SupplierId",
                table: "Payments",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Payments_Suppliers_SupplierId",
                table: "Payments",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
