/**
 * Provider types and default configurations
 */

import React from "react";
import {
  SiGooglecloud,
  SiKubernetes,
  SiDocker,
  SiTerraform,
} from "react-icons/si";
import { FaAws } from "react-icons/fa6";
import { VscAzure } from "react-icons/vsc";
import { MdApps } from "react-icons/md";
import { BiCategory } from "react-icons/bi";

export type ProviderOption = {
  id: string;
  name: string;
  icon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  color?: string;
  tags?: string[];
};

// Default provider configurations with icons
export const DEFAULT_PROVIDERS: ProviderOption[] = [
  { id: "all", name: "All Providers", icon: MdApps, color: "#6B7280" },
  {
    id: "AWS",
    name: "Amazon Web Services",
    icon: FaAws,
    color: "#FF9900",
    tags: ["aws", "amazon", "ec2", "s3", "lambda", "dynamodb", "sns", "sqs"],
  },
  {
    id: "Azure",
    name: "Azure",
    icon: VscAzure,
    color: "#0078D4",
    tags: ["azure", "az", "azure-ad"],
  },
  {
    id: "GCP",
    name: "Google Cloud Platform",
    icon: SiGooglecloud,
    color: "#4285F4",
    tags: ["gcp", "google", "compute", "storage", "functions"],
  },
  {
    id: "kubernetes",
    name: "Kubernetes",
    icon: SiKubernetes,
    color: "#326CE5",
    tags: ["k8s", "kubernetes", "pods", "services", "deployments"],
  },
  { id: "docker", name: "Docker", icon: SiDocker, color: "#2496ED" },
  { id: "terraform", name: "Terraform", icon: SiTerraform, color: "#7B42BC" },
  { id: "generic", name: "Generic", icon: BiCategory, color: "#8B5CF6" },
];
