import { createContext, useState, useContext, ReactNode, useEffect } from 'react';

export interface FormData {
  mainProduct: string;
  idealClient: string;
  campaignName: string;
  campaignObjective: string;
  campaign: string;
  metaCampaign: string;
  url: string[];
  emailSequence: string;
  emailSequencePurpose: string;
  emailSequence2: string;
  emailSequence2Purpose: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SavedFormData {
  whichuserId: string;
  forms: FormData[];
  _id: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FormContextType {
  forms: FormData[];
  currentFormIndex: number;
  setCurrentFormIndex: (idx: number) => void;
  formData: FormData;
  updateFormData: (newData: Partial<FormData>) => void;
  addNewForm: (form: FormData) => Promise<void>;
  updateCurrentForm: () => Promise<void>;
  isLoading: boolean;
  savedFormData?: SavedFormData;
}

const initialFormData: FormData = {
  mainProduct: '',
  idealClient: '',
  campaignName: '',
  campaignObjective: '',
  campaign: 'meta',
  metaCampaign: 'meta-campaign-1',
  url: [],
  emailSequence: '',
  emailSequencePurpose: '',
  emailSequence2: '',
  emailSequence2Purpose: '',
};

const FormContext = createContext<FormContextType>({
  forms: [],
  currentFormIndex: 0,
  setCurrentFormIndex: () => {},
  formData: initialFormData,
  updateFormData: () => {},
  addNewForm: async () => {},
  updateCurrentForm: async () => {},
  isLoading: true,
  savedFormData: undefined,
});

export function useFormContext() {
  return useContext(FormContext);
}

interface FormProviderProps {
  children: ReactNode;
}

export function FormProvider({ children }: FormProviderProps) {
  const [forms, setForms] = useState<FormData[]>([]);
  const [currentFormIndex, setCurrentFormIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [savedFormData, setSavedFormData] = useState<SavedFormData | undefined>(undefined);

  // Load all forms on mount
  useEffect(() => {
    fetch('/api/data-capture/dataCapture')
      .then(res => res.json())
      .then((data: FormData[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setForms(data);
          setCurrentFormIndex(0);
          setFormData(data[0]);
        } else {
          setForms([]);
          setFormData(initialFormData);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading forms:', error);
        setIsLoading(false);
      });
  }, []);

  // Keep formData in sync with currentFormIndex
  useEffect(() => {
    if (forms.length > 0 && currentFormIndex >= 0 && currentFormIndex < forms.length) {
      setFormData(forms[currentFormIndex]);
    } else {
      setFormData(initialFormData);
    }
  }, [forms, currentFormIndex]);

  function updateFormData(newData: Partial<FormData>) {
    setFormData(prev => ({ ...prev, ...newData }));
  }

  async function addNewForm(form: FormData) {
    setIsLoading(true);
    try {
      const response = await fetch('/api/data-capture/dataCapture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error('Failed to add form');
      const updated = await response.json();
      setForms(updated.forms || []);
      setCurrentFormIndex((updated.forms?.length || 1) - 1);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }

  async function updateCurrentForm() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/data-capture/dataCapture', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formIndex: currentFormIndex, form: formData }),
      });
      if (!response.ok) throw new Error('Failed to update form');
      const updatedForm = await response.json();
      setForms(prev => prev.map((f, i) => (i === currentFormIndex ? updatedForm : f)));
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  }

  return (
    <FormContext.Provider
      value={{
        forms,
        currentFormIndex,
        setCurrentFormIndex,
        formData,
        updateFormData,
        addNewForm,
        updateCurrentForm,
        isLoading,
        savedFormData,
      }}
    >
      {children}
    </FormContext.Provider>
  );
} 