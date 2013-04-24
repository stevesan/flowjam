while (<STDIN>) {
  if (!/^#/) {
    my $entry = $_;
    my ($word, @pronunciation) = split;
chomp ($entry);
print "$word   ";
#    print "Word: $word; pronunciation: @pronunciation\n";


    my $sonority_direction = $last_sonority_direction = up;
    my $last_sonority = 0;
    my @result = ();
    my $last_phoneme = "";
    foreach $phoneme (reverse @pronunciation) {

      $phoneme =~ s/[0-9]$//;

      $phonemes{$phoneme}++;
      $sonority = sonority($phoneme);
  
      if ($last_sonority < $sonority) { $sonority_direction = up};
      if ($last_sonority > $sonority) { $sonority_direction = down};

      if (($last_sonority == 3) && ($sonority == 1)) { # *tfa 
        $sonority_direction = up;
      }

      if (($last_phoneme eq "w")
          && (grep /$phoneme/, ("p", "b", "m", "f", "v"))
         ) {
        $last_sonority_direction = down;
        $sonority_direction = up; 
      }

      if (($last_phoneme eq "m")
          && ($sonority_direction eq "down")
          && (! (($phoneme eq "s") || ($phoneme eq "sh")))
         ) {
        $last_sonority_direction = down;
        $sonority_direction = up; 
      }

      if (($phoneme eq "m") 
          && ($sonority_direction eq "down")
          && ($last_sonority < 7)) { 
        $last_sonority_direction = down;
        $sonority_direction = up; 
      }

      if (($phoneme eq "n")
          && ($sonority_direction eq "down")
          && ($last_sonority < 6)) { 
        $last_sonority_direction = down;
        $sonority_direction = up; 
      }

      if (($last_phoneme eq "n")
          && ($sonority_direction eq "down")
          && (! (($phoneme eq "s") || ($phoneme eq "sh")))
         ) {
        $last_sonority_direction = down;
        $sonority_direction = up; 
      }

      if (($sonority_direction eq "down")
          && ($phoneme eq "ng")
         ) {
        $last_sonority_direction = down;
        $sonority_direction = up; 
      }

      if (($last_sonority == 7) && ($sonority == 7)) { # *haitus
        $last_sonority_direction = down;
        $sonority_direction = up; 
      }


      if (($sonority_direction eq "down")
          && ($last_sonority == 1) 
          && ($sonority == 1)
          && ($phoneme ne "s")
	  ) { # *ksi
        $sonority_direction = up;
      }

      if (($last_sonority_direction eq down) && ($sonority_direction eq up)) {
#        print " # ";
         push @result, (" - ");
      } 

#      push @result, ("$phoneme:$sonority");
      push @result, ("$phoneme");
      $last_sonority = $sonority;
      $last_sonority_direction = $sonority_direction; 
      $last_phoneme = $phoneme;

    }

    print join " ", reverse @result;

print "\n";
    if ($entry =~ /\s(\b[^aeiou\s]\w*\b\s*){4,}/) {
#      print "$1 $2 $3\n";
#      print $entry;
    }
    while ($entry =~ /\s(\b[^aeiou\s]\w*\b\s*)(\b[^aeiou\s]\w*\b\s*)/g) {
#       print "$1 $2\n";
    }
  }
}

sub sonority {
  my $ph = @_[0];
  if (grep /$ph/, ("s")) { return 1 };  # This one is a trick!
  if (grep /$ph/, ("p", "b", "t", "d", "k", "g")) { return 1 };
  if (grep /$ph/, ("ch", "jh")) { return 2 };
  if (grep /$ph/, ("th", "dh", "f", "v", "s", "z", "sh", "zh")) { return 3 };
  if (grep /$ph/, ("m", "n", "ng")) { return 4 };
  if (grep /$ph/, ("l", "r")) { return 5};
  if (grep /$ph/, ("hh")) { return 6};
  if (grep /$ph/, ("w", "y")) { return 6};
  return 7
}

sub read_syllable {
  my @string = @_;
  if (0 == length(@string)) { return }
  my $seen_vowel = 0;
  $phoneme .= pop(@string);
  if ($phoneme =~ /^[aeiou]/) { $seen_vowel = 1 }
}  

sub print_phonemes {
  foreach $key (sort keys %phonemes) {
    print "Phoneme: $key: $phonemes{$key}\n";
  }
}

print_phonemes;

