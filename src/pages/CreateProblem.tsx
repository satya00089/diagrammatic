import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "../components/ThemeSwitcher";
import { useTheme } from "../hooks/useTheme";
import AnimatedTextarea from "../components/shared/AnimatedTextarea";
import SEO from "../components/SEO";

type ArrayField = "requirements" | "constraints" | "hints" | "tags";

interface ArrayItemWithId {
  id: string;
  value: string;
}

const CreateProblem: React.FC = () => {
  useTheme();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemIdCounter = useRef(0);

  const generateItemId = () => {
    itemIdCounter.current += 1;
    return `item-${Date.now()}-${itemIdCounter.current}`;
  };

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard",
    category: "Web Application",
    estimatedTime: "30 minutes",
    requirements: [{ id: generateItemId(), value: "" }] as ArrayItemWithId[],
    constraints: [{ id: generateItemId(), value: "" }] as ArrayItemWithId[],
    hints: [{ id: generateItemId(), value: "" }] as ArrayItemWithId[],
    tags: [{ id: generateItemId(), value: "" }] as ArrayItemWithId[],
  });

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayItemChange = (
    field: ArrayField,
    id: string,
    value: string,
  ) => {
    const newArray = formData[field].map((item) =>
      item.id === id ? { ...item, value } : item,
    );
    setFormData((prev) => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field: ArrayField) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], { id: generateItemId(), value: "" }],
    }));
  };

  const removeArrayItem = (field: ArrayField, id: string) => {
    const newArray = formData[field].filter((item) => item.id !== id);
    setFormData((prev) => ({
      ...prev,
      [field]:
        newArray.length > 0 ? newArray : [{ id: generateItemId(), value: "" }],
    }));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    // Create a custom problem object
    const customProblem = {
      id: `custom-${Date.now()}`,
      title: formData.title,
      description: formData.description,
      difficulty: formData.difficulty,
      category: formData.category,
      estimated_time: formData.estimatedTime,
      requirements: formData.requirements
        .map((r) => r.value)
        .filter((v) => v.trim() !== ""),
      constraints: formData.constraints
        .map((c) => c.value)
        .filter((v) => v.trim() !== ""),
      hints: formData.hints.map((h) => h.value).filter((v) => v.trim() !== ""),
      tags: formData.tags.map((t) => t.value).filter((v) => v.trim() !== ""),
    };

    // Store in localStorage for now (you can replace with API call)
    localStorage.setItem(
      `custom-problem-${customProblem.id}`,
      JSON.stringify(customProblem),
    );

    // Small delay for better UX
    setTimeout(() => {
      navigate(`/playground/${customProblem.id}`);
    }, 300);
  };

  return (
    <>
      <SEO
        title="Create Custom System Design Problem | Diagrammatic"
        description="Create and share custom system design problems with your students or team. Define requirements, constraints, and evaluation criteria for personalized learning experiences."
        keywords="create system design problem, custom architecture challenge, teaching system design, system design assignment creator"
        url="https://satya00089.github.io/diagrammatic/#/create-problem"
      />
      <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] via-[var(--bg)] to-[var(--surface)] text-theme relative grid-pattern-overlay">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] transition-all duration-300 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="flex items-center space-x-3 group cursor-pointer"
              >
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-10 transition-transform group-hover:scale-110 duration-300"
                />
                <span className="text-xl font-bold text-white">
                  Diagrammatic
                </span>
              </button>
              <div className="flex items-center gap-4">
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="pt-16 relative z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Page Header */}
            <div className="text-center mb-12">
              <div className="inline-block mb-4">
                <span className="px-4 py-2 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] text-white text-sm font-semibold rounded-full shadow-lg">
                  ✨ Custom Problem Creator
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Create Custom Problem
              </h1>
              <p className="text-muted text-lg max-w-2xl mx-auto">
                Define your own system design challenge and start solving
              </p>
            </div>

            <div className="elevated-card-bg backdrop-blur-md rounded-3xl shadow-2xl p-8 md:p-12">
              <div className="space-y-8">
                {/* Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="text-sm font-bold text-theme mb-3 flex items-center gap-2"
                  >
                    <span className="text-xl">📝</span> Problem Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Design a URL Shortener"
                    className="w-full px-5 py-4 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--bg)] text-theme text-lg transition-all duration-300 hover:border-[var(--brand)]/30"
                  />
                </div>

                {/* Description */}
                <div>
                  <AnimatedTextarea
                    id="description"
                    label="📄 Description *"
                    value={formData.description}
                    onChange={(value) =>
                      handleInputChange("description", value)
                    }
                    placeholder="Describe the problem in detail..."
                  />
                </div>

                {/* Difficulty & Category */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label
                      htmlFor="difficulty"
                      className="text-sm font-bold text-theme mb-3 flex items-center gap-2"
                    >
                      <span className="text-xl">📊</span> Difficulty
                    </label>
                    <select
                      id="difficulty"
                      value={formData.difficulty}
                      onChange={(e) =>
                        handleInputChange(
                          "difficulty",
                          e.target.value as "Easy" | "Medium" | "Hard",
                        )
                      }
                      className="w-full px-5 py-4 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--bg)] text-theme cursor-pointer transition-all duration-300 hover:border-[var(--brand)]/30"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="category"
                      className="text-sm font-bold text-theme mb-3 flex items-center gap-2"
                    >
                      <span className="text-xl">🏷️</span> Category
                    </label>
                    <input
                      id="category"
                      type="text"
                      value={formData.category}
                      onChange={(e) =>
                        handleInputChange("category", e.target.value)
                      }
                      placeholder="e.g., Web Application"
                      className="w-full px-5 py-4 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--bg)] text-theme transition-all duration-300 hover:border-[var(--brand)]/30"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="estimatedTime"
                      className="text-sm font-bold text-theme mb-3 flex items-center gap-2"
                    >
                      <span className="text-xl">⏱️</span> Estimated Time
                    </label>
                    <input
                      id="estimatedTime"
                      type="text"
                      value={formData.estimatedTime}
                      onChange={(e) =>
                        handleInputChange("estimatedTime", e.target.value)
                      }
                      placeholder="e.g., 30 minutes"
                      className="w-full px-5 py-4 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--bg)] text-theme transition-all duration-300 hover:border-[var(--brand)]/30"
                    />
                  </div>
                </div>

                {/* Requirements */}
                <div className="rounded-2xl bg-[var(--surface)]/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-bold text-theme flex items-center gap-2">
                      <span className="text-xl">✅</span> Requirements
                    </div>
                    <button
                      type="button"
                      onClick={() => addArrayItem("requirements")}
                      className="px-4 py-2 text-sm text-white bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer font-semibold"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.requirements.map((item, index) => (
                    <div key={item.id} className="mb-4">
                      <div className="flex gap-3 items-start">
                        <div className="flex-1">
                          <AnimatedTextarea
                            id={`requirement-${item.id}`}
                            label={`Requirement ${index + 1}`}
                            value={item.value}
                            onChange={(value) =>
                              handleArrayItemChange(
                                "requirements",
                                item.id,
                                value,
                              )
                            }
                            placeholder="Enter a requirement (supports rich text formatting)"
                          />
                        </div>
                        {formData.requirements.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeArrayItem("requirements", item.id)
                            }
                            className="px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer font-bold text-lg mt-8"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="rounded-2xl bg-[var(--surface)]/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-bold text-theme flex items-center gap-2">
                      <span className="text-xl">⚠️</span> Constraints
                    </div>
                    <button
                      type="button"
                      onClick={() => addArrayItem("constraints")}
                      className="px-4 py-2 text-sm text-white bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer font-semibold"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.constraints.map((item) => (
                    <div key={item.id} className="flex gap-3 mb-3">
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) =>
                          handleArrayItemChange(
                            "constraints",
                            item.id,
                            e.target.value,
                          )
                        }
                        placeholder="Enter a constraint"
                        className="flex-1 px-4 py-3 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--bg)] text-theme transition-all duration-300"
                      />
                      {formData.constraints.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            removeArrayItem("constraints", item.id)
                          }
                          className="px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer font-bold text-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Hints */}
                <div className="rounded-2xl bg-[var(--surface)]/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-bold text-theme flex items-center gap-2">
                      <span className="text-xl">💡</span> Hints (Optional)
                    </div>
                    <button
                      type="button"
                      onClick={() => addArrayItem("hints")}
                      className="px-4 py-2 text-sm text-white bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] rounded-lg hover:shadow-lg transition-all duration-300 cursor-pointer font-semibold"
                    >
                      + Add
                    </button>
                  </div>
                  {formData.hints.map((item) => (
                    <div key={item.id} className="flex gap-3 mb-3">
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) =>
                          handleArrayItemChange(
                            "hints",
                            item.id,
                            e.target.value,
                          )
                        }
                        placeholder="Enter a helpful hint"
                        className="flex-1 px-4 py-3 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--bg)] text-theme transition-all duration-300"
                      />
                      {formData.hints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem("hints", item.id)}
                          className="px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer font-bold text-lg"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="rounded-2xl bg-[var(--surface)]/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm font-bold text-theme flex items-center gap-2">
                      <span className="text-xl">🏷️</span> Tags
                    </div>
                  </div>

                  {/* Tag Chips Display */}
                  {formData.tags.some((item) => item.value.trim()) && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {formData.tags
                        .filter((item) => item.value.trim())
                        .map((item) => (
                          <div
                            key={item.id}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-300 group"
                          >
                            <span>{item.value}</span>
                            <button
                              type="button"
                              onClick={() => removeArrayItem("tags", item.id)}
                              className="hover:bg-white/20 rounded-full p-1 transition-colors"
                              aria-label="Remove tag"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Tag Input */}
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={formData.tags.at(-1)?.value || ""}
                      onChange={(e) =>
                        handleArrayItemChange(
                          "tags",
                          formData.tags.at(-1)?.id || "",
                          e.target.value,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          e.preventDefault();
                          addArrayItem("tags");
                        }
                      }}
                      placeholder="Type a tag and press Enter (e.g., caching, scalability)"
                      className="flex-1 px-4 py-3 border-2 border-[var(--theme)]/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent bg-[var(--bg)] text-theme transition-all duration-300 hover:border-[var(--brand)]/30"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.tags.at(-1)?.value.trim()) {
                          addArrayItem("tags");
                        }
                      }}
                      className="px-6 py-3 text-white bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] rounded-xl hover:shadow-lg transition-all duration-300 cursor-pointer font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t-2 border-[var(--theme)]/10">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={
                      !formData.title || !formData.description || isSubmitting
                    }
                    className="flex-1 px-8 py-4 bg-gradient-to-r from-[var(--brand)] to-[var(--accent)] text-white font-bold rounded-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 cursor-pointer flex items-center justify-center gap-3 text-lg hover:scale-105"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="inline-block w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />{" "}
                        Creating...
                      </>
                    ) : (
                      <>🚀 Create & Start Designing</>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    disabled={isSubmitting}
                    className="px-8 py-4 elevated-card-bg border-2 border-[var(--theme)]/10 text-theme font-bold rounded-xl hover:border-[var(--brand)]/30 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateProblem;
