import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MixedPrescription } from "../../services/dispense.service";
import { Prescriptions } from "@interfaces/prescriptions";
import AndesPrescriptions from "@interfaces/andesPrescriptions";
import { getStatusVariant, getStatusLabel } from "@shared/utils/status.utils";

@Component({
    selector: "app-dispense-item",
    templateUrl: "./dispense-item.component.html",
    styleUrls: ["./dispense-item.component.sass"],
    standalone: false,
})
export class DispenseItemComponent {
    @Input() prescription!: MixedPrescription;
    @Input() selected = false;

    @Output() select = new EventEmitter<MixedPrescription>();
    @Output() dispense = new EventEmitter<MixedPrescription>();
    @Output() print = new EventEmitter<MixedPrescription>();
    @Output() cancelDispense = new EventEmitter<MixedPrescription>();

    getStatusVariant = getStatusVariant;
    getStatusLabel = getStatusLabel;

    private get isAndesItem(): boolean {
        return "estadoActual" in this.prescription;
    }

    private get andes(): AndesPrescriptions | null {
        return this.isAndesItem
            ? (this.prescription as AndesPrescriptions)
            : null;
    }

    private get local(): Prescriptions | null {
        return this.isAndesItem ? null : (this.prescription as Prescriptions);
    }

    get sourceLabel(): string {
        return this.isAndesItem ? "Andes" : "RecetAR";
    }

    get medicineName(): string {
        const andes = this.andes;
        if (andes) {
            return andes.medicamento?.concepto?.term || "";
        }
        return this.local?.supplies?.[0]?.supply?.name || "";
    }

    get medicineType(): "duplicado" | "triplicado" | null {
        const supplies = this.local?.supplies;
        if (!supplies) {
            return null;
        }
        if (supplies.some((s) => s.triplicate)) {
            return "triplicado";
        }
        if (supplies.some((s) => s.duplicate)) {
            return "duplicado";
        }
        return null;
    }

    get patientFullName(): string {
        const andes = this.andes;
        if (andes) {
            return `${andes.paciente?.apellido || ""}, ${andes.paciente?.nombre || ""}`.replace(
                /^,\s*/,
                "",
            );
        }
        return `${this.local?.patient?.lastName || ""}, ${this.local?.patient?.firstName || ""}`.replace(
            /^,\s*/,
            "",
        );
    }

    get patientDni(): string {
        const andes = this.andes;
        return andes
            ? andes.paciente?.documento || ""
            : this.local?.patient?.dni || "";
    }

    get professionalName(): string {
        const andes = this.andes;
        if (andes) {
            return (
                (andes.profesional as unknown as { nombre?: string })?.nombre ||
                ""
            );
        }
        return this.local?.professional?.businessName || "";
    }

    get quantity(): number {
        const andes = this.andes;
        if (andes) {
            return andes.medicamento?.cantidad || 1;
        }
        return (
            this.local?.supplies?.reduce(
                (sum, s) => sum + (s.quantity || 1),
                0,
            ) || 1
        );
    }

    get status(): string {
        const andes = this.andes;
        return andes
            ? andes.estadoActual?.tipo || ""
            : this.local?.status || "";
    }

    get date(): string | Date {
        const andes = this.andes;
        return andes
            ? andes.fechaPrestacion || andes.fechaRegistro || ""
            : this.local?.date || "";
    }

    get creationDate(): Date | null {
        const andes = this.andes;
        const raw = andes
            ? andes.fechaRegistro || andes.fechaPrestacion || ""
            : this.local?.date || "";
        if (!raw) {
            return null;
        }
        const d = new Date(raw);
        return isNaN(d.getTime()) ? null : d;
    }

    get expirationDate(): Date | null {
        const andes = this.andes;
        const raw = andes
            ? andes.fechaRegistro || andes.fechaPrestacion
            : this.local?.date || null;
        if (!raw) {
            return null;
        }
        const base = new Date(raw);
        if (isNaN(base.getTime())) {
            return null;
        }
        return new Date(base.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    get daysToExpire(): number | null {
        if (!this.expirationDate) {
            return null;
        }
        const diff = this.expirationDate.getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    get isExpired(): boolean {
        return this.status.toLowerCase() === "vencida";
    }

    get isPending(): boolean {
        const s = this.status.toLowerCase();
        return s === "pendiente" || s === "vigente";
    }

    get isDispensed(): boolean {
        const s = this.status.toLowerCase();
        return s === "dispensada" || s === "dispensado" || s === "finalizada";
    }

    get canCancelDispense(): boolean {
        if (!this.isDispensed) {
            return false;
        }
        const andes = this.andes;
        const dispensedAt = andes
            ? andes.estadoDispensaActual?.fecha
            : this.local?.dispensedAt;
        if (!dispensedAt) {
            return false;
        }
        const elapsed =
            (Date.now() - new Date(dispensedAt).getTime()) / (1000 * 60 * 60);
        return elapsed < 2;
    }

    get dispensedAt(): string {
        const andes = this.andes;
        return andes
            ? String(andes.estadoDispensaActual?.fecha || "")
            : String(this.local?.dispensedAt || "");
    }

    get undoDisabled(): boolean {
        if (!this.isDispensed) {
            return true;
        }
        if (!this.dispensedAt) {
            return false;
        }
        const elapsed =
            (Date.now() - new Date(this.dispensedAt).getTime()) /
            (1000 * 60 * 60);
        return elapsed >= 2;
    }

    onSelect(): void {
        this.select.emit(this.prescription);
    }

    onDispense(): void {
        this.dispense.emit(this.prescription);
    }

    onPrint(): void {
        this.print.emit(this.prescription);
    }

    onCancelDispense(): void {
        this.cancelDispense.emit(this.prescription);
    }
}
