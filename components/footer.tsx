import Link from "next/link"
import { MapPin, Mail, Phone, Facebook, Twitter, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-secondary text-secondary-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary rounded-lg p-2">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-bold">JanSamvedan</h3>
                <p className="text-sm text-secondary-foreground/80">Smart India Hackathon Project</p>
              </div>
            </div>
            <p className="text-secondary-foreground/80 mb-4 max-w-md">
              Empowering citizens to report civic issues and enabling efficient resolution through technology. Building
              better communities together.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-secondary-foreground/60 hover:text-secondary-foreground">
                <Facebook className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-secondary-foreground/60 hover:text-secondary-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-secondary-foreground/60 hover:text-secondary-foreground">
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-secondary-foreground/60" />
                <span className="text-sm">support@jansamvedan.gov.in</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-secondary-foreground/60" />
                <span className="text-sm">1800-XXX-XXXX</span>
              </div>
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-secondary-foreground/60 mt-0.5" />
                <span className="text-sm">
                  Municipal Corporation Office
                  <br />
                  City Center, India
                </span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <div className="space-y-2">
              <Link
                href="/privacy"
                className="block text-sm text-secondary-foreground/80 hover:text-secondary-foreground"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="block text-sm text-secondary-foreground/80 hover:text-secondary-foreground"
              >
                Terms of Service
              </Link>
              <Link href="/help" className="block text-sm text-secondary-foreground/80 hover:text-secondary-foreground">
                Help Center
              </Link>
              <Link
                href="/about"
                className="block text-sm text-secondary-foreground/80 hover:text-secondary-foreground"
              >
                About Us
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 mt-8 pt-8 text-center">
          <p className="text-sm text-secondary-foreground/60">
            © 2024 JanSamvedan. Built for Smart India Hackathon. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
