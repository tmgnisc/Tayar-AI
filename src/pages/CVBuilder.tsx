import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/config/api';
import {
  FileText,
  Download,
  Save,
  Plus,
  Trash2,
  Loader2,
  Eye,
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  Globe,
  FolderGit2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  startDate: string;
  endDate: string;
  gpa: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  technologies: string;
  link: string;
}

export default function CVBuilder() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState('modern');
  const { toast } = useToast();
  const cvRef = useRef<HTMLDivElement>(null);

  // Form data
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
  });
  const [summary, setSummary] = useState('');
  const [experience, setExperience] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certInput, setCertInput] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);
  const [langInput, setLangInput] = useState('');

  useEffect(() => {
    loadCV();
  }, []);

  const loadCV = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await apiRequest('api/cv', {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }, token);

      const data = await response.json();

      if (response.ok && data.cv) {
        const cv = data.cv;
        setTemplate(cv.template || 'modern');
        setPersonalInfo(cv.personal_info || {});
        setSummary(cv.summary || '');
        setExperience(cv.experience || []);
        setEducation(cv.education || []);
        setSkills(cv.skills || []);
        setProjects(cv.projects || []);
        setCertifications(cv.certifications || []);
        setLanguages(cv.languages || []);
      }
    } catch (error) {
      console.error('Load CV error:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveCV = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await apiRequest('api/cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          template,
          personal_info: personalInfo,
          summary,
          experience,
          education,
          skills,
          projects,
          certifications,
          languages,
        }),
      }, token);

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Your CV has been saved.',
        });
      } else {
        throw new Error('Failed to save CV');
      }
    } catch (error) {
      console.error('Save CV error:', error);
      toast({
        title: 'Error',
        description: 'Failed to save CV. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadPDF = async () => {
    if (!cvRef.current) return;

    try {
      toast({
        title: 'Generating PDF...',
        description: 'Please wait while we create your CV.',
      });

      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`${personalInfo.fullName || 'CV'}_Resume.pdf`);

      toast({
        title: 'Success!',
        description: 'Your CV has been downloaded.',
      });
    } catch (error) {
      console.error('Download PDF error:', error);
      toast({
        title: 'Error',
        description: 'Failed to download PDF. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Add/Remove functions
  const addExperience = () => {
    setExperience([...experience, {
      id: Date.now().toString(),
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
    }]);
  };

  const removeExperience = (id: string) => {
    setExperience(experience.filter(exp => exp.id !== id));
  };

  const addEducation = () => {
    setEducation([...education, {
      id: Date.now().toString(),
      institution: '',
      degree: '',
      field: '',
      startDate: '',
      endDate: '',
      gpa: '',
    }]);
  };

  const removeEducation = (id: string) => {
    setEducation(education.filter(edu => edu.id !== id));
  };

  const addProject = () => {
    setProjects([...projects, {
      id: Date.now().toString(),
      name: '',
      description: '',
      technologies: '',
      link: '',
    }]);
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter(proj => proj.id !== id));
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const addCertification = () => {
    if (certInput.trim()) {
      setCertifications([...certifications, certInput.trim()]);
      setCertInput('');
    }
  };

  const addLanguage = () => {
    if (langInput.trim()) {
      setLanguages([...languages, langInput.trim()]);
      setLangInput('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <FileText className="w-10 h-10 text-primary" />
              CV Builder
            </h1>
            <p className="text-muted-foreground mt-2">
              Create your professional resume in minutes
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={saveCV} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save CV
                </>
              )}
            </Button>

            <Button onClick={downloadPDF} className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Side */}
          <div className="space-y-6">
            <Card className="p-6">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="personal">
                    <User className="w-4 h-4 mr-2" />
                    Personal
                  </TabsTrigger>
                  <TabsTrigger value="experience">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Work
                  </TabsTrigger>
                  <TabsTrigger value="education">
                    <GraduationCap className="w-4 h-4 mr-2" />
                    Education
                  </TabsTrigger>
                  <TabsTrigger value="skills">
                    <Code className="w-4 h-4 mr-2" />
                    Skills
                  </TabsTrigger>
                </TabsList>

                {/* Personal Info Tab */}
                <TabsContent value="personal" className="space-y-4">
                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      value={personalInfo.fullName}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={personalInfo.email}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label>Phone *</Label>
                      <Input
                        value={personalInfo.phone}
                        onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                        placeholder="+1 234 567 8900"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input
                      value={personalInfo.location}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, location: e.target.value })}
                      placeholder="San Francisco, CA"
                    />
                  </div>
                  <div>
                    <Label>LinkedIn</Label>
                    <Input
                      value={personalInfo.linkedin}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })}
                      placeholder="linkedin.com/in/johndoe"
                    />
                  </div>
                  <div>
                    <Label>GitHub</Label>
                    <Input
                      value={personalInfo.github}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, github: e.target.value })}
                      placeholder="github.com/johndoe"
                    />
                  </div>
                  <div>
                    <Label>Portfolio Website</Label>
                    <Input
                      value={personalInfo.portfolio}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })}
                      placeholder="johndoe.com"
                    />
                  </div>
                  <div>
                    <Label>Professional Summary</Label>
                    <Textarea
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="A brief professional summary highlighting your expertise and career goals..."
                      rows={4}
                    />
                  </div>
                </TabsContent>

                {/* Experience Tab */}
                <TabsContent value="experience" className="space-y-4">
                  {experience.map((exp, index) => (
                    <Card key={exp.id} className="p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Experience #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExperience(exp.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <Input
                          value={exp.company}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[index].company = e.target.value;
                            setExperience(updated);
                          }}
                          placeholder="Company Name"
                        />
                        <Input
                          value={exp.position}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[index].position = e.target.value;
                            setExperience(updated);
                          }}
                          placeholder="Job Title"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="month"
                            value={exp.startDate}
                            onChange={(e) => {
                              const updated = [...experience];
                              updated[index].startDate = e.target.value;
                              setExperience(updated);
                            }}
                          />
                          <Input
                            type="month"
                            value={exp.endDate}
                            onChange={(e) => {
                              const updated = [...experience];
                              updated[index].endDate = e.target.value;
                              setExperience(updated);
                            }}
                            disabled={exp.current}
                            placeholder={exp.current ? 'Present' : ''}
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={exp.current}
                            onChange={(e) => {
                              const updated = [...experience];
                              updated[index].current = e.target.checked;
                              if (e.target.checked) updated[index].endDate = '';
                              setExperience(updated);
                            }}
                          />
                          Currently working here
                        </label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => {
                            const updated = [...experience];
                            updated[index].description = e.target.value;
                            setExperience(updated);
                          }}
                          placeholder="Describe your responsibilities and achievements..."
                          rows={3}
                        />
                      </div>
                    </Card>
                  ))}
                  <Button onClick={addExperience} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Experience
                  </Button>
                </TabsContent>

                {/* Education Tab */}
                <TabsContent value="education" className="space-y-4">
                  {education.map((edu, index) => (
                    <Card key={edu.id} className="p-4 bg-muted/30">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">Education #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEducation(edu.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <Input
                          value={edu.institution}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[index].institution = e.target.value;
                            setEducation(updated);
                          }}
                          placeholder="Institution Name"
                        />
                        <Input
                          value={edu.degree}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[index].degree = e.target.value;
                            setEducation(updated);
                          }}
                          placeholder="Degree (e.g., Bachelor of Science)"
                        />
                        <Input
                          value={edu.field}
                          onChange={(e) => {
                            const updated = [...education];
                            updated[index].field = e.target.value;
                            setEducation(updated);
                          }}
                          placeholder="Field of Study (e.g., Computer Science)"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="month"
                            value={edu.startDate}
                            onChange={(e) => {
                              const updated = [...education];
                              updated[index].startDate = e.target.value;
                              setEducation(updated);
                            }}
                          />
                          <Input
                            type="month"
                            value={edu.endDate}
                            onChange={(e) => {
                              const updated = [...education];
                              updated[index].endDate = e.target.value;
                              setEducation(updated);
                            }}
                          />
                          <Input
                            value={edu.gpa}
                            onChange={(e) => {
                              const updated = [...education];
                              updated[index].gpa = e.target.value;
                              setEducation(updated);
                            }}
                            placeholder="GPA"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                  <Button onClick={addEducation} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Education
                  </Button>
                </TabsContent>

                {/* Skills Tab */}
                <TabsContent value="skills" className="space-y-4">
                  {/* Skills */}
                  <div>
                    <Label>Technical Skills</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        placeholder="e.g., React, Node.js, Python"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <Button onClick={addSkill} type="button">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {skill}
                          <button
                            onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                            className="hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Projects */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label>Projects</Label>
                      <Button onClick={addProject} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Project
                      </Button>
                    </div>
                    {projects.map((proj, index) => (
                      <Card key={proj.id} className="p-3 bg-muted/30 mb-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Input
                              value={proj.name}
                              onChange={(e) => {
                                const updated = [...projects];
                                updated[index].name = e.target.value;
                                setProjects(updated);
                              }}
                              placeholder="Project Name"
                              className="flex-1 mr-2"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeProject(proj.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                          <Input
                            value={proj.technologies}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[index].technologies = e.target.value;
                              setProjects(updated);
                            }}
                            placeholder="Technologies used (e.g., React, Node.js)"
                          />
                          <Textarea
                            value={proj.description}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[index].description = e.target.value;
                              setProjects(updated);
                            }}
                            placeholder="Project description..."
                            rows={2}
                          />
                          <Input
                            value={proj.link}
                            onChange={(e) => {
                              const updated = [...projects];
                              updated[index].link = e.target.value;
                              setProjects(updated);
                            }}
                            placeholder="Project URL (optional)"
                          />
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Certifications */}
                  <div>
                    <Label>Certifications</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={certInput}
                        onChange={(e) => setCertInput(e.target.value)}
                        placeholder="e.g., AWS Certified Developer"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCertification())}
                      />
                      <Button onClick={addCertification} type="button">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-1">
                      {certifications.map((cert, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted/30 p-2 rounded">
                          <span className="text-sm">{cert}</span>
                          <button
                            onClick={() => setCertifications(certifications.filter((_, i) => i !== index))}
                            className="text-destructive hover:text-destructive/80"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Languages */}
                  <div>
                    <Label>Languages</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={langInput}
                        onChange={(e) => setLangInput(e.target.value)}
                        placeholder="e.g., English (Native), Spanish (Fluent)"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
                      />
                      <Button onClick={addLanguage} type="button">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {languages.map((lang, index) => (
                        <span
                          key={index}
                          className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm flex items-center gap-2"
                        >
                          {lang}
                          <button
                            onClick={() => setLanguages(languages.filter((_, i) => i !== index))}
                            className="hover:text-destructive"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Preview Side */}
          <div>
            <Card className="p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Live Preview</h3>
              </div>
              <div 
                ref={cvRef} 
                className="bg-white text-black p-8 rounded-lg shadow-lg min-h-[800px] overflow-auto"
                style={{ maxHeight: '800px' }}
              >
                {/* CV Preview will be rendered based on template */}
                {template === 'modern' && (
                  <ModernTemplate
                    personalInfo={personalInfo}
                    summary={summary}
                    experience={experience}
                    education={education}
                    skills={skills}
                    projects={projects}
                    certifications={certifications}
                    languages={languages}
                  />
                )}
                {template === 'professional' && (
                  <ProfessionalTemplate
                    personalInfo={personalInfo}
                    summary={summary}
                    experience={experience}
                    education={education}
                    skills={skills}
                    projects={projects}
                    certifications={certifications}
                    languages={languages}
                  />
                )}
                {template === 'developer' && (
                  <DeveloperTemplate
                    personalInfo={personalInfo}
                    summary={summary}
                    experience={experience}
                    education={education}
                    skills={skills}
                    projects={projects}
                    certifications={certifications}
                    languages={languages}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Template Components (simplified - you can enhance these)
interface TemplateProps {
  personalInfo: PersonalInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: string[];
  projects: Project[];
  certifications: string[];
  languages: string[];
}

function ModernTemplate({ personalInfo, summary, experience, education, skills, projects, certifications, languages }: TemplateProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center border-b-2 border-blue-600 pb-4">
        <h1 className="text-3xl font-bold text-blue-900">{personalInfo.fullName || 'Your Name'}</h1>
        <p className="text-sm text-gray-600 mt-2">
          {personalInfo.email && `${personalInfo.email} | `}
          {personalInfo.phone && `${personalInfo.phone} | `}
          {personalInfo.location}
        </p>
        {(personalInfo.linkedin || personalInfo.github || personalInfo.portfolio) && (
          <p className="text-sm text-blue-600 mt-1">
            {personalInfo.linkedin && `LinkedIn: ${personalInfo.linkedin} | `}
            {personalInfo.github && `GitHub: ${personalInfo.github} | `}
            {personalInfo.portfolio}
          </p>
        )}
      </div>

      {/* Summary */}
      {summary && (
        <div>
          <h2 className="text-xl font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">Professional Summary</h2>
          <p className="text-sm text-gray-700">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-blue-900 border-b border-gray-300 pb-1 mb-3">Experience</h2>
          {experience.map((exp) => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{exp.position}</h3>
                  <p className="text-sm text-gray-700">{exp.company}</p>
                </div>
                <p className="text-sm text-gray-600">
                  {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                </p>
              </div>
              <p className="text-sm text-gray-700 mt-1">{exp.description}</p>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-blue-900 border-b border-gray-300 pb-1 mb-3">Education</h2>
          {education.map((edu) => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900">{edu.degree} in {edu.field}</h3>
                  <p className="text-sm text-gray-700">{edu.institution}</p>
                </div>
                <p className="text-sm text-gray-600">
                  {edu.startDate} - {edu.endDate}
                  {edu.gpa && ` | GPA: ${edu.gpa}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">Skills</h2>
          <p className="text-sm text-gray-700">{skills.join(' • ')}</p>
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-blue-900 border-b border-gray-300 pb-1 mb-3">Projects</h2>
          {projects.map((proj) => (
            <div key={proj.id} className="mb-3">
              <h3 className="font-bold text-gray-900">{proj.name}</h3>
              <p className="text-xs text-gray-600 italic">{proj.technologies}</p>
              <p className="text-sm text-gray-700 mt-1">{proj.description}</p>
              {proj.link && <p className="text-xs text-blue-600 mt-1">{proj.link}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">Certifications</h2>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {certifications.map((cert, index) => (
              <li key={index}>{cert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-blue-900 border-b border-gray-300 pb-1 mb-2">Languages</h2>
          <p className="text-sm text-gray-700">{languages.join(' • ')}</p>
        </div>
      )}
    </div>
  );
}

function ProfessionalTemplate(props: TemplateProps) {
  return <ModernTemplate {...props} />; // Can customize later
}

function DeveloperTemplate(props: TemplateProps) {
  return <ModernTemplate {...props} />; // Can customize later
}

