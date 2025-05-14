import mongoose, { Schema, Document } from 'mongoose';

export interface FormEntry {
  campaignName?: string;
  campaignObjective?: string;
  mainProduct?: string;
  idealClient?: string;
  campaign?: string;
  metaCampaign?: string;
  emailSequence?: string;
  emailSequencePurpose?: string;
  emailSequence2?: string;
  emailSequence2Purpose?: string;
  url?: string;
  url2?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DataCaptureType extends Document {
  userId: string;
  forms: FormEntry[];
}

// Create a separate schema for FormEntry
const FormEntrySchema = new Schema<FormEntry>({
  campaignName: { type: String, default: '' },
  campaignObjective: { type: String, default: '' },
  mainProduct: { type: String, default: '' },
  idealClient: { type: String, default: '' },
  campaign: { type: String, default: 'meta' },
  metaCampaign: { type: String, default: 'meta-campaign-1' },
  emailSequence: { type: String, default: '' },
  emailSequencePurpose: { type: String, default: '' },
  emailSequence2: { type: String, default: '' },
  emailSequence2Purpose: { type: String, default: '' },
  url: { type: [String], default: [] },
}, { 
  timestamps: true,
  _id: true // Ensure each form entry has its own ID
});

// Main schema with explicit forms array definition
const DataCaptureSchema: Schema<DataCaptureType> = new Schema({
  userId: { type: String, required: true, unique: true },
  forms: {
    type: [FormEntrySchema],
    default: [],
    required: true
  }
}, { timestamps: true });

// Add pre-save hook to ensure forms array exists
DataCaptureSchema.pre('save', function(next) {
  if (!this.forms) {
    this.forms = [];
  }
  next();
});

const DataCaptureModel =
  mongoose.models.DataCapture || mongoose.model<DataCaptureType>('DataCapture', DataCaptureSchema);

export default DataCaptureModel;
